import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/PageHeader";
import FormInput from "../../components/forms/FormInput";
import FormTextarea from "../../components/forms/FormTextarea";
import DivisionTiles from "../../components/forms/DivisionTiles";
import { useDivision } from "../../context/DivisionContext";
import { useAuth } from "../../context/AuthContext";
import { useActivity } from "../../context/ActivityContext";
import { DIVISIONS } from "../../constants/divisions";
import type { DivisionId } from "../../constants/divisions";
import FileUploader from "../../components/FileUploader";
import type { Invoice } from "../../types/finance";
import { financeService } from "../../services/financeService";
import { projectService } from "../../services/projectService";
import { quotationService } from "../../services/quotationService";
import type { Project } from "../../types/project";
import type { Proposal } from "../../types/pm";

const EXPENSE_CATEGORIES = [
  "Office Rent",
  "Office Expenses",
  "Materials & Supplies",
  "Salaries & Wages",
  "Transportation",
  "Documentation Renewals",
  "Equipment Rental",
  "Subcontractor Fees",
  "Utilities",
  "Insurance",
  "Maintenance & Repairs",
  "Marketing & Advertising",
  "Legal & Professional",
  "Miscellaneous",
];

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Credit Card",
  "Debit Card",
  "Cheque",
  "Online Payment",
];

// Prefix maps removed as backend handles sequences

interface ReferenceOption {
  id: string;
  label: string;
}

interface ExpenseForm {
  expenseName: string;
  category: string;
  division: DivisionId;
  referenceId: string;
  amount: number;
  taxRate: number;
  taxAmount: number;
  vendor: string;
  paymentMethod: string;
  date: string;
  attachment: string;
  notes: string;
  allocationType: "SINGLE" | "SMART";
  allocations: {
    contracting: number;
    trading: number;
    service: number;
  };
}

function CreateExpense() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  
  const { activeDivision } = useDivision();
  const { user } = useAuth();
  const { logActivity } = useActivity();
  const [referenceOptions, setReferenceOptions] = useState<ReferenceOption[]>([]);

  

  const [form, setForm] = useState<ExpenseForm>({
    expenseName: "",
    category: "",
    division: (activeDivision === "all" ? "contracting" : activeDivision) as DivisionId,
    referenceId: "",
    amount: 0,
    taxRate: 0,
    taxAmount: 0,
    vendor: "",
    paymentMethod: "",
    date: new Date().toISOString().split("T")[0],
    attachment: "",
    notes: "",
    allocationType: "SINGLE",
    allocations: {
      contracting: 0,
      trading: 0,
      service: 0
    },
    approvalStatus: "pending"
  });

  const { data: dbExpense, isLoading: isFetching } = useQuery({
    queryKey: ["expense", id],
    queryFn: () => financeService.getExpense(id!),
    enabled: isEditing
  });

  // Fetch real projects and quotations for the dropdown
  const { data: apiProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getProjects()
  });

  const { data: apiQuotations = [] } = useQuery({
    queryKey: ["quotations"],
    queryFn: () => quotationService.getQuotations()
  });

  useEffect(() => {
    if (dbExpense) {
      setForm(prev => ({
        ...prev,
        expenseName: dbExpense.description || "",
        category: dbExpense.category || "",
        division: (dbExpense.allocation_type === "SMART" ? "all" : (dbExpense.allocations?.[0]?.division?.toLowerCase() || dbExpense.division?.toLowerCase() || "contracting")) as DivisionId,
        referenceId: dbExpense.reference_id || "",
        amount: Number(dbExpense.total_amount) || 0,
        taxRate: Number(dbExpense.tax_rate) || 0,
        taxAmount: Number(dbExpense.tax_amount) || 0,
        vendor: dbExpense.vendor || "",
        paymentMethod: dbExpense.payment_method || "",
        date: dbExpense.date ? new Date(dbExpense.date).toISOString().split('T')[0] : prev.date,
        attachment: dbExpense.attachment || "",
        notes: dbExpense.notes || "",
        allocationType: dbExpense.allocation_type || "SINGLE",
        allocations: dbExpense.allocations?.reduce((acc: any, curr: any) => {
          acc[curr.division.toLowerCase()] = Number(curr.percentage) || 0;
          return acc;
        }, { contracting: 0, trading: 0, service: 0 }),
        approvalStatus: dbExpense.approval_status?.toLowerCase() === "pending_approval" ? "pending" : dbExpense.approval_status?.toLowerCase()
      }));
    }
  }, [dbExpense]);

  // Load reference options based on division
  useEffect(() => {
    // Map internal division IDs to data filter labels
    const mappedRefType = form.division === "service" ? "SERVICE" : form.division.toUpperCase();

    const filteredProjects = apiProjects.filter(p => 
      (p.division || "").toUpperCase() === mappedRefType
    );
    
    const filteredQuotations = apiQuotations.filter(q => 
      (q.division || "").toUpperCase() === mappedRefType
    );

    const options: ReferenceOption[] = [
      ...filteredProjects.map((p) => ({
        id: String(p.id),
        label: `Project: ${p.name || p.projectName}`,
      })),
      ...filteredQuotations.map((q) => ({
        id: String(q.id),
        label: `Ref: ${q.qtn_number} - ${q.project_name || q.client_name || 'No Name'}`,
      })),
    ];
    
    setReferenceOptions(options);
  }, [form.division, apiProjects, apiQuotations]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleDivisionChange = (newDivision: DivisionId) => {
    const divisionConfig = DIVISIONS.find(d => d.id === newDivision);
    setForm({ 
      ...form, 
      division: newDivision, 
      allocationType: "SINGLE",
      referenceId: "",
      taxRate: divisionConfig?.taxRate || 0
    });
  };

  const handleAllocationChange = (division: "contracting" | "trading" | "service", value: string) => {
    const percent = Number(value) || 0;
    setForm(prev => ({
      ...prev,
      allocations: {
        ...prev.allocations,
        [division]: percent
      }
    }));
  };




  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isApproved = user?.role === "SUPER_ADMIN";
    const amountNum = Number(form.amount) || 0;

    const expenseData: any = {
      category: form.category,
      description: form.expenseName,
      totalAmount: amountNum,
      date: form.date,
      allocationType: form.allocationType,
      division: form.division.toUpperCase(),
      vendor: form.vendor,
      paymentMethod: form.paymentMethod,
      taxRate: Number(form.taxRate) || 0,
      taxAmount: amountNum * (Number(form.taxRate) || 0) / 100,
      referenceId: form.referenceId,
      attachment: form.attachment,
      notes: form.notes,
      allocations: form.allocationType === "SMART" ? [
        { division: "CONTRACTING", percentage: form.allocations.contracting },
        { division: "TRADING", percentage: form.allocations.trading },
        { division: "SERVICE", percentage: form.allocations.service }
      ] : [],
      approval_status: form.approvalStatus === "pending" ? "PENDING_APPROVAL" : form.approvalStatus?.toUpperCase()
    };

    // Validate Smart Allocation
    if (form.allocationType === "SMART") {
      const totalPercent = Object.values(form.allocations || {}).reduce((a, b) => a + (b || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        alert("Smart Allocation must total exactly 100%");
        return;
      }
    }

    const mutationFn = isEditing
      ? financeService.updateExpense(id!, expenseData)
      : financeService.createExpense(expenseData);

    mutationFn
      .then(async () => {
        const activityMessage = isEditing
          ? `Updated Expense: ${form.expenseName}`
          : (isApproved ? `Recorded Expense: ${form.expenseName}` : `Requested Expense Approval: ${form.expenseName}`);
        
        logActivity(activityMessage, "finance", "/expenses", form.expenseName);
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
        if (isEditing) queryClient.invalidateQueries({ queryKey: ["expense", id] });
        navigate("/expenses");
      })
      .catch((err: any) => {
        console.error("EXPENSE SAVE ERROR:", err);
        alert(`Failed to ${isEditing ? 'update' : 'save'} expense: ` + (err.response?.data?.message || err.message));
      });
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-full transition-colors"
        >
        </button>
        <PageHeader showBack
          title={isEditing ? "Edit Expense" : "Add New Expense"}
          subtitle={isEditing ? "Update existing expense details" : "Record a new company or project expense"}
        />
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
        {isFetching ? (
           <div className="py-12 text-center text-slate-500 font-medium">Loading expense details...</div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Expense Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput
                label="Expense Name *"
                name="expenseName"
                value={form.expenseName}
                onChange={handleChange}
                placeholder="e.g. Glass Panel Purchase"
                required
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Category *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 w-full outline-none focus:ring-2 focus:ring-brand-500 transition-shadow bg-white"
                >
                  <option value="">Select Category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <FormInput
                label="Amount (QAR) *"
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
              />

              {isEditing && user?.role === "SUPER_ADMIN" && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-500 uppercase">Status</label>
                  <select
                    name="approvalStatus"
                    value={form.approvalStatus || "pending"}
                    onChange={handleChange}
                    className="border rounded-lg px-3 py-2 w-full outline-none focus:ring-2 focus:ring-brand-500 transition-shadow bg-blue-50/50 text-blue-800 font-bold"
                  >
                    <option value="pending">PENDING</option>
                    <option value="approved">APPROVED</option>
                    <option value="rejected">REJECTED</option>
                  </select>
                </div>
              )}

              <FormInput
                label="Expense Date *"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />

              <FormInput
                label="Tax Rate (%)"
                type="number"
                name="taxRate"
                value={form.taxRate}
                onChange={handleChange}
                placeholder="0"
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-400">Calculated Tax Amount</label>
                <div className="px-3 py-2 bg-slate-50 border rounded-lg text-slate-500 font-medium">
                  QAR {((Number(form.amount) || 0) * (Number(form.taxRate) || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Vendor & Payment */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Vendor & Payment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput
                label="Vendor / Payee *"
                name="vendor"
                value={form.vendor}
                onChange={handleChange}
                placeholder="Enter vendor or payee name..."
                required
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Payment Method *</label>
                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  required
                  className="border rounded-lg px-3 py-2 w-full outline-none focus:ring-2 focus:ring-brand-500 transition-shadow bg-white"
                >
                  <option value="">Select Payment Method</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Reference / Linking */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6 border-b border-slate-100 pb-2">
              Link to Division / Project
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-700">Allocation Mode</h4>
                  <p className="text-[10px] text-slate-500">Choose between single division or distributed allocation.</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                   <button 
                     type="button"
                     onClick={() => setForm({...form, allocationType: "SINGLE"})}
                     className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${form.allocationType === "SINGLE" ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     Single Division
                   </button>
                   <button 
                     type="button"
                     onClick={() => setForm({...form, allocationType: "SMART"})}
                     className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${form.allocationType === "SMART" ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     Smart Allocation
                   </button>
                </div>
              </div>

               {form.allocationType === "SINGLE" && (
                <DivisionTiles 
                  label="Select Division / Sector" 
                  selectedId={form.division} 
                  onChange={handleDivisionChange} 
                />
              )}



              {form.allocationType === "SMART" && (
                <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-6">
                   <h4 className="text-[11px] font-bold text-brand-700 uppercase tracking-widest mb-4">Division Distribution (%)</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Contracting</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={form.allocations.contracting}
                            onChange={(e) => handleAllocationChange("contracting", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Trading</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={form.allocations.trading}
                            onChange={(e) => handleAllocationChange("trading", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Service</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={form.allocations.service}
                            onChange={(e) => handleAllocationChange("service", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                        </div>
                      </div>
                   </div>
                   <div className="mt-4 pt-4 border-t border-brand-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Total Allocation</span>
                      <span className={`text-sm font-black ${Math.abs(Object.values(form.allocations).reduce((a, b) => a + b, 0) - 100) < 0.01 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {Object.values(form.allocations).reduce((a, b) => a + b, 0)}%
                      </span>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">
                    Link to Project / Proposal (Optional)
                  </label>
                  <select
                    name="referenceId"
                    value={form.referenceId}
                    onChange={handleChange}
                    className="border rounded-lg px-3 py-2 w-full outline-none focus:ring-2 focus:ring-brand-500 transition-shadow bg-white"
                  >
                    <option value="">-- None --</option>
                    {referenceOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Attachment & Notes */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Attachment & Notes
            </h3>

            {/* File Upload */}
            <div className="mb-5">
              <label className="text-sm font-bold text-slate-700 mb-3 block">
                Attach Bills / Receipts
              </label>
              <FileUploader 
                onUpload={(files: any[]) => {
                  if (files.length > 0) {
                    setForm(prev => ({ ...prev, attachment: files[0].name }));
                  }
                }}
              />
            </div>
            <FormTextarea
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any additional details about this expense..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="bg-brand-600 text-white px-8 py-2.5 rounded-lg hover:bg-brand-700 transition-colors font-medium shadow-sm"
            >
              {isEditing ? "Update Expense" : "Save Expense"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
export default CreateExpense;