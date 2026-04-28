import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Edit, Loader2 } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { financeService } from "../../services/financeService";
import type { Invoice, InvoiceItem } from "../../types/finance";

export default function InvoiceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isClient = user?.role === "CLIENT";

    useEffect(() => {
        const fetchInvoice = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const data: any = await financeService.getInvoice(id);
                
                if (data && data.invoice) {
                    const inv = data.invoice;
                    const items = (data.items || []).map((it: any) => ({
                        id: it.id,
                        description: it.description,
                        quantity: it.quantity,
                        unitPrice: it.unit_price,
                        amount: it.total,
                        code: it.code
                    }));

                    const mappedInvoice: Invoice = {
                        id: inv.id,
                        invoiceNo: inv.invoice_number,
                        client: inv.client_name || inv.client,
                        customerCode: inv.customer_code,
                        clientId: inv.client_id,
                        status: inv.status,
                        date: inv.invoice_date,
                        dueDate: inv.due_date,
                        amount: inv.total_amount,
                        total: inv.total_amount,
                        taxRate: inv.tax_rate,
                        taxAmount: inv.tax_amount,
                        discount: inv.discount,
                        advance: Number(inv.amount_paid),
                        balance: Number(inv.balance_amount),
                        items: items,
                        division: inv.division,
                        branch: inv.division,
                        notes: inv.notes,
                        lpoNo: inv.lpo_no,
                        salesman: inv.salesman,
                        qid: inv.qid,
                        address: inv.address,
                        refType: inv.ref_type,
                        refNo: inv.reference_number,
                        paymentTerms: inv.payment_terms,
                        invoiceType: inv.invoice_type || "Credit",
                        approvalStatus: inv.approval_status
                    };
                    setInvoice(mappedInvoice);
                } else {
                    setError("Invoice data not found");
                }
            } catch (err: any) {
                console.error("Error fetching invoice:", err);
                setError(err.message || "Failed to load invoice");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoice();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 size={40} className="animate-spin text-brand-600" />
                <p className="text-slate-500 font-medium">Loading invoice details...</p>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="p-6 text-center space-y-4">
                <div className="text-red-500 font-bold">{error || "Invoice not found."}</div>
                <button onClick={() => navigate(-1)} className="text-brand-600 hover:underline flex items-center gap-2 justify-center">
                    <ArrowLeft size={16} /> Go Back
                </button>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };


    const items = invoice.items || [];
    const totalAmount = invoice.total || 0;
    const advance = invoice.advance || 0;
    const discount = invoice.discount || 0;
    const balance = invoice.balance || (totalAmount - advance);

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-6 no-print">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Invoice: {invoice.invoiceNo}</h1>
                    <StatusBadge status={invoice.status} />
                </div>
                <div className="flex gap-3">
                    {!isClient && (
                        <button onClick={() => navigate(`/edit-invoice/${id}`)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 transition">
                            <Edit size={16} />
                            Edit
                        </button>
                    )}
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm">
                        <Printer size={16} />
                        Print / Download PDF
                    </button>
                </div>
            </div>

            {/* NEW CONTRACTING INVOICE DESIGN (Visual Match) */}
            <div className="max-w-[900px] mx-auto bg-white shadow-xl border border-black overflow-hidden print:shadow-none print:border-none print:m-0 print:w-full font-sans text-black">

                {/* Header Section */}
                <div className="p-8 pb-4 flex justify-between items-start border-b border-black">
                    <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="TrekGroup Logo" className="w-16 h-16 object-contain" />
                        <h1 className="text-4xl font-black tracking-tight self-center uppercase">INVOICE</h1>
                    </div>

                    <div className="text-right flex flex-col items-end">
                        <div className="text-brand-600 font-bold text-xl flex flex-col items-end leading-tight max-w-[400px] text-right">
                            <span className="text-black text-xs font-bold opacity-60">TREK GROUP TRADING CONTRACTING AND SERVICES</span>
                            <span className="text-brand-600 text-lg font-black tracking-[0.2em] uppercase mt-1">
                                {(invoice.branch?.toLowerCase() === "service" || invoice.branch?.toLowerCase() === "business") ? "Service Sector" :
                                    invoice.branch?.toLowerCase() === "trading" ? "Trading Sector" :
                                        "Contracting Sector"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 border-b border-black text-[13px]">
                    <div className="border-r border-black p-4 space-y-2">
                        <div className="grid grid-cols-[130px_1fr]">
                            <span className="font-bold">Invoice Type:</span>
                            <span>{invoice.invoiceType || "Credit"}</span>
                        </div>
                        <div className="grid grid-cols-[130px_1fr]">
                            <span className="font-bold">Customer Name:</span>
                            <span className="font-black">{invoice.client}</span>
                        </div>
                        <div className="grid grid-cols-[130px_1fr]">
                            <span className="font-bold uppercase">PROJECT:</span>
                            <span className="font-black uppercase">{invoice.refNo ? invoice.refNo : (invoice.project || "")}</span>
                        </div>
                        <div className="grid grid-cols-[130px_1fr] mt-4 min-h-[3rem]">
                            <span className="font-bold">Address:</span>
                            <span className="whitespace-pre-wrap">{invoice.address || ""}</span>
                        </div>
                        <div className="grid grid-cols-[130px_1fr]">
                            <span className="font-bold">Tel:</span>
                            <span>{invoice.tel || "+974 71716559"}</span>
                        </div>
                        <div className="grid grid-cols-[130px_1fr]">
                            <span className="font-bold">QID:</span>
                            <span>{invoice.qid || ""}</span>
                        </div>
                    </div>

                    <div className="p-4 space-y-2 text-left">
                        <div className="grid grid-cols-[100px_1fr]">
                            <span className="font-bold">Invoice No.:</span>
                            <span className="font-black">{invoice.invoiceNo.split('-').pop()}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr]">
                            <span className="font-bold">Date:</span>
                            <span>{new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] mt-4">
                            <span className="font-bold uppercase">LPO No.:</span>
                            <span className="font-black">{invoice.lpoNo || ""}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] mt-2">
                            <span className="font-bold">Salesman:</span>
                            <span>{invoice.salesman || ""}</span>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="min-h-[400px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-black text-sm font-black">
                                <th className="border-r border-black p-2 w-12 text-center uppercase">No.</th>
                                <th className="border-r border-black p-2 w-24 text-center uppercase">Item Code</th>
                                <th className="border-r border-black p-2 text-left uppercase">Item Description</th>
                                <th className="border-r border-black p-2 w-20 text-center uppercase">Qty</th>
                                <th className="border-r border-black p-2 w-28 text-center uppercase">Unit Price</th>
                                <th className="border-r border-black p-2 w-24 text-center uppercase">Discount</th>
                                <th className="p-2 w-32 text-center uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length > 0 ? items.map((item, idx: number) => (
                                <tr key={idx} className="border-b border-black leading-tight h-10">
                                    <td className="border-r border-black p-2 text-center align-top">{idx + 1}</td>
                                    <td className="border-r border-black p-2 text-center align-top">{item.code || ""}</td>
                                    <td className="border-r border-black p-2 text-[12px] align-top whitespace-pre-wrap font-medium">
                                        {item.description}
                                    </td>
                                    <td className="border-r border-black p-2 text-center align-top">{item.quantity}</td>
                                    <td className="border-r border-black p-2 text-center align-top">{Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="border-r border-black p-2 text-center align-top">{item.discount || ""}</td>
                                    <td className="p-2 text-right font-medium align-top">{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            )) : (
                                Array.from({ length: 12 }).map((_, i) => (
                                    <tr key={i} className="border-b border-black h-8 opacity-10">
                                        <td className="border-r border-black"></td>
                                        <td className="border-r border-black"></td>
                                        <td className="border-r border-black"></td>
                                        <td className="border-r border-black"></td>
                                        <td className="border-r border-black"></td>
                                        <td className="border-r border-black"></td>
                                        <td></td>
                                    </tr>
                                ))
                            )}
                            {/* Filling empty space with grid lines */}
                            {items.length > 0 && items.length < 12 && Array.from({ length: 12 - items.length }).map((_, i) => (
                                <tr key={`empty-${i}`} className="border-b border-black h-8">
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Sub-Total Row */}
                <div className="flex border-b border-black h-10 font-black text-sm">
                    <div className="flex-1 flex items-center justify-end px-4 border-r border-black uppercase">Total</div>
                    <div className="w-20 flex items-center justify-center border-r border-black text-lg">-</div>
                    <div className="w-28 border-r border-black"></div>
                    <div className="w-24 border-r border-black"></div>
                    <div className="w-32 flex items-center justify-end px-4 border-l border-black">{Number(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
                </div>

                {/* Bottom Section: Remarks & Summary */}
                <div className="flex text-[13px] border-b border-black">
                    <div className="flex-1 border-r border-black flex flex-col min-h-[160px]">
                        <div className="p-4 h-24 border-b border-black">
                            <span className="font-extrabold uppercase text-[14px]">Remarks:</span>
                        </div>
                        <div className="p-4 flex-1 relative">
                            <span className="font-extrabold uppercase text-[14px]">Notes:</span>
                            <div className="absolute bottom-8 right-16 text-center leading-tight">
                            </div>
                        </div>
                    </div>

                    <div className="w-[305px] flex flex-col">
                        <div className="flex border-b border-black h-12">
                            <div className="w-[120px] p-2 font-black flex items-center border-r border-black uppercase text-xs">Advance:</div>
                            <div className="flex-1 p-2 flex items-center justify-end font-bold">{advance > 0 ? Number(advance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}</div>
                        </div>
                        <div className="flex border-b border-black h-12">
                            <div className="w-[120px] p-2 font-black flex items-center border-r border-black uppercase text-xs">Discount</div>
                            <div className="flex-1 p-2 flex items-center justify-end font-bold">{discount > 0 ? Number(discount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}</div>
                        </div>
                        <div className="flex h-16 border-b border-black">
                            <div className="w-[120px] p-2 font-black flex items-center border-r border-black leading-tight uppercase text-xs">Balance<br />Payable</div>
                            <div className="flex-1 p-2 flex items-center justify-end font-black text-xl">{Number(balance).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
                        </div>
                        <div className="flex-1"></div>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="p-4 text-center text-[15px] font-black italic">
                    Thanks for your business! Please Visit Again.
                </div>

            </div>

            <style>{`
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-slate-50 { background: white !important; }
          .p-6 { padding: 0 !important; }
          .max-w-\\[900px\\] { 
            max-width: 100% !important; 
            width: 210mm !important;
            border: 1px solid black !important; 
            box-shadow: none !important; 
            margin: 0 auto !important;
            display: block !important;
          }
          .font-black { font-weight: 900 !important; }
          .font-bold { font-weight: 700 !important; }
          @page { 
            size: A4 portrait; 
            margin: 10mm; 
          }
        }
      `}</style>
        </div>
    );
}
