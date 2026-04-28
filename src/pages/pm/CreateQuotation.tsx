import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import FormInput from "../../components/forms/FormInput";
import { Plus, Trash2, Save } from "lucide-react";
import DivisionTiles from "../../components/forms/DivisionTiles";
import { useDivision } from "../../context/DivisionContext";
import { useApprovals } from "../../context/ApprovalContext";
import { useAuth } from "../../context/AuthContext";
import { useActivity } from "../../context/ActivityContext";
import type { DivisionId } from "../../constants/divisions";
import ClientAutocomplete from "../../components/forms/ClientAutocomplete";
import { useQuery } from "@tanstack/react-query";
import { quotationService } from "../../services/quotationService";
import type { QuotationItem } from "../../types/pm";

export default function CreateQuotation() {
    const navigate = useNavigate();
    const params = useParams();
    const editId = params.id;
    const isEditing = !!editId;
    const { activeDivision } = useDivision();
    const { requestApproval } = useApprovals();
    const { user } = useAuth();
    const { logActivity } = useActivity();

    const isPM = user?.role === "PROJECT_MANAGER";
    const userDivision = (user?.division || "CONTRACTING").toUpperCase() as DivisionId;

    const DEFAULTS = {
        service: {
            // ... (keeping same as before)
            aboutUs: "Trek Group Business Services is a trusted provider of comprehensive corporate and industrial setup solutions in Qatar. We specialize in guiding investors and entrepreneurs through every stage of company formation, licensing, and operational setup, ensuring compliance with all local laws and regulations. Our expertise extends to supporting industrial projects with end-to-end documentation, approvals, and advisory services.",
            whatWeDo: "Company formation and trade license registration\nIndustrial license applications and approvals\nGovernment liaison and PRO services\nSpecial approval coordination for industrial projects\nComprehensive project documentation and compliance",
            proposalIntro: "Trek Group Business Services proposes to manage the complete setup of a new company in Qatar.\n\nThe company’s commercial activities will be as follows:\n\nActivity 1 – Provision of advertising services and advertising materials production\nProviding advertising and promotional services, including design, development, printing, and production of advertising materials such as banners, signboards, brochures, digital advertisements, promotional items, and related marketing materials in accordance with applicable regulations\n\nActivity 2 - Wholesale of stationery\nEngaging in the wholesale trading and distribution of stationery items including office supplies, paper products, writing instruments, school materials, filing products, and related accessories to retailers, institutions, and commercial establishments in accordance with applicable regulations.",
            financialTerms: "Total Package Cost: QAR 11,000 (all-inclusive)\n\nThis charge includes:\n• Trade name registration\n• Commercial Registration (CR) issuance\n• Trade licence registration\n• All documentation and necessary approvals for company setup\n• Establishment ID issuance\n• Tax registration\n• Ministry of Labour (MOL) registration\n• Ministry of Interior (MOI) update\n\nNote: This activity is subject to obtaining prior approval from the Ministry of Culture – Department of Press and Publication for registration of press and publishing activities. This charge excludes all deposits and other government related charges.",
            clientDuties: "1. Provide required documents for CR approval (QID, Passport, Police Clearance, National Address, Mobile/Email)\n2. Provide office/building space documents for trade licence registration\n3. Responsible for providing and paying all bank-related deposits, requirements, and charges\n4. Submit signatures and info in a timely manner\n5. Arrange and cover all office-related services and costs\n6. Attend any ministry or authority appointments\n7. Ensure accuracy of all submitted documents",
            paymentTerms: "50% advance payment upon acceptance of this proposal.\nRemaining 50% payable upon completion and signing of company formation documentation.\n\nPrices are subject to revision in case of changes to client requirements or government fee structures. All government approval fees shall be paid directly by the client."
        },
        standard: {
            aboutUs: "",
            whatWeDo: "",
            proposalIntro: "With reference to the above-mentioned subject and your inquiry, please find below our final\nrock bottom prices: -",
            financialTerms: "1. Payment: 50% advance, 30% upon delivery, and 20% upon completion\n2. Delivery: with 15 days from the advance payment.\n3. Above prices are subjected to change against the significant market prices fluctuation.\n4. Offer is valid for 15 Days\n5. This quotation is prepared on the basis of the specifications provided in the scope of works and limited to the same.\n6. All scaffolding, electrical connections, and manlift provisions shall be provided by the Client\n7. The above pricing is based on the specifications provided and limited to the quantities stated above. Any variation on the above specifications or quantities will result in change of price and also effect the delivery period. For any changes required to be made other than the scope of works stated, should be made in writing and need written confirmation in order to carry out the same.\n8. We will not be responsible for delivery arising out of delays in approvals of drawings, samples, payments, any natural calamities or pandemics or any situation that is beyond our control.",
            clientDuties: "",
            paymentTerms: ""
        }
    };

    const initialDivision = isPM ? userDivision : (activeDivision === "all" ? "CONTRACTING" : activeDivision.toUpperCase()) as DivisionId;
    const initialDefaults = initialDivision === "SERVICE" ? DEFAULTS.service : DEFAULTS.standard;

    const [form, setForm] = useState({
        division: initialDivision,
        project: "",
        client: "",
        customerCode: "",
        quoteId: "",
        status: "PENDING_APPROVAL",
        date: new Date().toISOString().split('T')[0],
        discount: 0,
        ...initialDefaults
    });

    const allowedSectors = useMemo(() => {
        return isPM && user?.division ? [user.division.toUpperCase()] : [];
    }, [isPM, user]);

    // Document number is now handled by the backend
    useEffect(() => {
        if (!isEditing) {
            setForm(prev => ({ ...prev, quoteId: "" }));
        }
    }, [form.division, isEditing]);

    useEffect(() => {
        if (!isPM && activeDivision !== "all") {
            const division = activeDivision.toUpperCase() as DivisionId;
            const defaults = division === "SERVICE" ? DEFAULTS.service : DEFAULTS.standard;
            setForm(prev => ({
                ...prev,
                division,
                ...defaults
            }));
        }
    }, [activeDivision, isPM]);

    // Handle division change in creation mode
    const handleDivisionChange = (newDivision: DivisionId | "all") => {
        const divisionToSet = (newDivision === "all" ? "CONTRACTING" : newDivision) as DivisionId;
        if (!isEditing) {
            const defaults = divisionToSet === "SERVICE" ? DEFAULTS.service : DEFAULTS.standard;
            setForm(prev => ({
                ...prev,
                division: divisionToSet,
                client: "",
                customerCode: "",
                ...defaults
            }));
        } else {
            setForm(prev => ({ ...prev, division: divisionToSet }));
        }
    };

    const [items, setItems] = useState<QuotationItem[]>([
        { description: "", quantity: 1, unitPrice: 0, amount: 0 }
    ]);

    // Fetch existing quotation from database if editing
    const { data: existingQuotation } = useQuery({
        queryKey: ["quotation", editId],
        queryFn: () => quotationService.getQuotation(editId!),
        enabled: isEditing && !!editId
    });

    useEffect(() => {
        if (isEditing && existingQuotation) {
            const found = existingQuotation;
            setForm(prev => ({
                ...prev,
                division: (found.division || "CONTRACTING") as DivisionId,
                project: found.project || "",
                client: found.client_name || found.client || "",
                customerCode: found.client_id?.toString() || "",
                quoteId: found.qtn_number || "",
                status: found.status || found.Status || prev.status,
                date: found.created_at ? new Date(found.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                discount: found.discount || 0,
                aboutUs: found.aboutUs || prev.aboutUs,
                whatWeDo: found.whatWeDo || prev.whatWeDo,
                proposalIntro: found.proposalIntro || prev.proposalIntro,
                financialTerms: found.financialTerms || prev.financialTerms,
                clientDuties: found.clientDuties || prev.clientDuties,
                paymentTerms: found.paymentTerms || prev.paymentTerms,
            }));

            if (found.items && found.items.length > 0) {
                setItems(found.items);
            }
        }
    }, [isEditing, existingQuotation]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
        const newItems = [...items];
        const updatedItem = { ...newItems[index], [field]: value };
        
        // Recalculate item amount
        if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.amount = Number(updatedItem.quantity) * Number(updatedItem.unitPrice);
        }
        
        newItems[index] = updatedItem;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleClientChange = (name: string, clientId?: string) => {
        setForm({ ...form, client: name, customerCode: clientId || "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Calculate totals
        const calculatedItems = items.map(item => ({
            ...item,
            amount: Number(item.quantity) * Number(item.unitPrice)
        }));

        const totalAmount = calculatedItems.reduce((sum, item) => sum + item.amount, 0);
        const netTotal = totalAmount - Number(form.discount);
        const isApproved = user?.role === "SUPER_ADMIN";

        const submissionData: any = {
            quotation_number: isEditing ? form.quoteId : "",
            client_id: Number(form.customerCode) || 0, 
            division: form.division.toUpperCase(),
            total_amount: netTotal,
            status: form.status,
            items: calculatedItems,
            client_name: form.client,
            project_name: form.project,
            valid_until: new Date(new Date(form.date).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            terms: form.financialTerms + "\n" + form.paymentTerms
        };

        try {
            if (isEditing && editId) {
                await quotationService.updateQuotation(editId, submissionData);
            } else {
                await quotationService.createQuotation(submissionData);
                
                // If not admin, request approval
                if (!isApproved) {
                    requestApproval({
                        type: "quotation",
                        itemId: form.quoteId,
                        itemNumber: form.quoteId,
                        division: form.division,
                        amount: netTotal,
                        notes: form.proposalIntro
                    });
                }
            }

            const activityMessage = isApproved 
                ? `${isEditing ? "Updated" : "Created"} Quotation ${form.quoteId}`
                : `${isEditing ? "Updated" : "Created"} Quotation ${form.quoteId} (Pending Approval)`;

            logActivity(activityMessage, "project", "/quotations", form.quoteId);
            navigate(`/quotations/${activeDivision}`);
        } catch (err: any) {
            console.error("ERROR SAVING QUOTATION:", err);
            const errorMsg = err.response?.data?.message || "Failed to save quotation to database.";
            alert(`${errorMsg}\nPlease ensure you have selected a valid client from the dropdown.`);
        }
    };

    return (
        <div className="p-6">
            <PageHeader showBack
                title={isEditing ? "Edit Quotation" : "Create Quotation"}
                subtitle="Generate a detailed cost estimate for Business, Contracting or Trading"
            />

            <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm max-w-4xl mt-6">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Sector Selection (Visual Tiles) */}
                    <DivisionTiles
                        label="Select Division / Sector"
                        selectedId={form.division}
                        onChange={handleDivisionChange}
                        allowedIds={allowedSectors}
                        showAll={false}
                    />

                    {/* Header Details */}
                    <div className="pt-6 border-t border-slate-50">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <FormInput 
                                label="Quote ID" 
                                name="quoteId" 
                                value={form.quoteId || "AUTO-GENERATED BY BACKEND"} 
                                disabled 
                                className={!form.quoteId ? "text-emerald-600 font-bold italic" : ""} 
                            />
                            <FormInput label="Date" type="date" name="date" value={form.date} onChange={handleChange} required />
                            
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Client Selection *</label>
                                <ClientAutocomplete
                                    value={form.client}
                                    onChange={handleClientChange}
                                    division={form.division}
                                    placeholder="Search client..."
                                />
                            </div>



                            <FormInput 
                                label="Customer Code" 
                                name="customerCode" 
                                value={form.customerCode} 
                                disabled 
                                placeholder="Auto-generated"
                            />

                            <FormInput label="Project Name" name="project" value={form.project} placeholder="e.g. ALWAAAB RESIDENCY MAIN ENTRANCE" onChange={handleChange} required />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <div className="flex justify-between items-end mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-slate-800">Products / Services</h3>
                            <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium">
                                <Plus size={16} /> Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description (Product Type)</label>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md"
                                            placeholder="Supply and installation of..."
                                            required
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">QTY</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unit Price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total</label>
                                        <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-600 font-medium text-right">
                                            {(item.quantity * item.unitPrice).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="pt-6">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-md transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals & Discount */}
                    <div className="flex justify-end pt-4">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                                <span>Subtotal</span>
                                <span>{items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                                <span>Discount (Flat)</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.discount}
                                    onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                                    className="w-24 px-2 py-1 text-right bg-slate-50 border border-slate-200 rounded-md"
                                />
                            </div>
                            <div className="flex justify-between items-center text-lg font-black text-slate-900 pt-2 border-t">
                                <span>Net Total</span>
                                <span>{(items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) - form.discount).toLocaleString()} QAR</span>
                            </div>
                        </div>
                    </div>

                    {/* Proposal Content Customization */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-slate-800 border-b-2 border-brand-500 pb-2">Proposal Content (Customizable)</h3>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">About Us</label>
                            <textarea
                                name="aboutUs"
                                value={form.aboutUs}
                                onChange={(e) => setForm({ ...form, aboutUs: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">What We Do (One item per line)</label>
                            <textarea
                                name="whatWeDo"
                                value={form.whatWeDo}
                                onChange={(e) => setForm({ ...form, whatWeDo: e.target.value })}
                                rows={5}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Proposal Introduction & Activities</label>
                            <textarea
                                name="proposalIntro"
                                value={form.proposalIntro}
                                onChange={(e) => setForm({ ...form, proposalIntro: e.target.value })}
                                rows={10}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Financial & Commercial Terms</label>
                                <textarea
                                    name="financialTerms"
                                    value={form.financialTerms}
                                    onChange={(e) => setForm({ ...form, financialTerms: e.target.value })}
                                    rows={8}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Client Duties</label>
                                <textarea
                                    name="clientDuties"
                                    value={form.clientDuties}
                                    onChange={(e) => setForm({ ...form, clientDuties: e.target.value })}
                                    rows={8}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Payment Terms & Notes</label>
                            <textarea
                                name="paymentTerms"
                                value={form.paymentTerms}
                                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                                rows={5}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 font-bold"
                        >
                            <Save size={18} />
                            {editId ? "Update Quotation" : "Generate Quotation"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
