import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Edit } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { numberToWords } from "../../utils/numberToWords";
import { printDocument } from "../../utils/exportUtils";
import BusinessProposalView from "./BusinessProposalView";
import type { Quotation, QuotationItem } from "../../types/pm";
import { useQuery } from "@tanstack/react-query";
import { quotationService } from "../../services/quotationService";
import { useAuth } from "../../context/AuthContext";

export default function QuotationDetails() {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: rawQuotation, isLoading, error } = useQuery({
        queryKey: ["quotation", id],
        queryFn: () => quotationService.getQuotation(id!),
        enabled: !!id
    });

    if (isLoading) return <div className="p-6 text-center text-slate-500">Loading quotation details...</div>;
    
    if (error || !rawQuotation) {
        return (
            <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-100 max-w-2xl mx-auto my-12">
                <p className="text-red-500 mb-4 font-bold text-xl">Quotation Not Found</p>
                <p className="text-slate-500 mb-6">The record you are looking for might have been deleted or moved.</p>
                <button 
                  onClick={() => navigate(-1)} 
                  className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition"
                >
                    Return to List
                </button>
            </div>
        );
    }

    // Explicit Mapping for compatibility with the view
    const q: any = rawQuotation;
    const quotation: Quotation = {
        ...q,
        id: q.id,
        "Quote ID": q.qtn_number || q.id,
        refNo: q.qtn_number || q.id,
        project: q.project_name || q.project || "N/A",
        client: q.client_name || q.client_company || q.client || "N/A",
        totalAmount: Number(q.total_amount || 0),
        Status: q.status || "Submitted",
        branch: q.division || "Contracting",
        date: q.created_at || q.date || new Date().toISOString()
    };

    const handlePrint = () => {
        printDocument();
    };

    const branch = quotation.branch || "Contracting";
    const isTrading = branch.toLowerCase() === "trading";
    const isBusiness = branch.toLowerCase() === "business" || branch.toLowerCase() === "service";
    const title = isTrading ? "Trek Group Trading" : (isBusiness ? "Trek Group Business Services" : "Trek Group Contracting");
    const headerColor = isTrading ? "bg-[#8dc63f]" : (isBusiness ? "bg-[#1a1a1a]" : "bg-[#8dc63f]");

    // Ensure items exist
    const items = quotation.items || [];

    const totalAmount = quotation.totalAmount || 0;
    const discount = 0;
    const netTotal = totalAmount - discount;

    // Format Date
    const qDate = new Date(quotation.date || new Date().toISOString());
    const dayStr = qDate.toLocaleDateString('en-GB', { day: '2-digit' });
    const monthStr = qDate.toLocaleDateString('en-GB', { month: 'long' }).toUpperCase();
    const yearStr = qDate.getFullYear();

    const dayNum = qDate.getDate();
    const j = dayNum % 10, k = dayNum % 100;
    let suffix = "TH";
    if (j == 1 && k != 11) suffix = "ST";
    if (j == 2 && k != 12) suffix = "ND";
    if (j == 3 && k != 13) suffix = "RD";

    if (isBusiness) {
        return (
            <div className="bg-slate-50 min-h-screen">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6 no-print font-sans">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                            <h1 className="text-2xl font-bold">Business Proposal: {quotation["Quote ID"] || quotation.id}</h1>
                            <StatusBadge status={quotation.Status || "Submitted"} />
                        </div>
                        <div className="flex gap-3">
                            {user?.role !== "CLIENT" && (
                                <button onClick={() => navigate('/edit-quotation/' + (quotation["Quote ID"] || quotation.id))} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 transition bg-white font-medium">
                                    <Edit size={16} /> Edit
                                </button>
                            )}
                            <button onClick={handlePrint} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm font-medium">
                                <Printer size={16} /> Print / Download PDF
                            </button>
                        </div>
                    </div>
                    <BusinessProposalView quotation={quotation} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-6 no-print font-sans">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Quotation: {quotation["Quote ID"] || quotation.id}</h1>
                    <StatusBadge status={quotation.Status || "Submitted"} />
                </div>
                <div className="flex gap-3">
                    {user?.role !== "CLIENT" && (
                        <button onClick={() => navigate('/edit-quotation/' + (quotation["Quote ID"] || quotation.id))} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 transition bg-white font-medium">
                            <Edit size={16} /> Edit
                        </button>
                    )}
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm font-medium">
                        <Printer size={16} /> Print / Download PDF
                    </button>
                </div>
            </div>

            {/* A4 Document Container */}
            <div className="w-[850px] mx-auto bg-[#e6e4ec] shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0 font-['Arial',_Helvetica,_sans-serif] text-black leading-snug print-page">

                {/* Header Section */}
                <div className="p-8 pb-5 flex justify-between items-start">
                    <div className="bg-[#2a2944] w-52 h-[170px] flex flex-col justify-center items-center p-4">
                        <div className="w-[70px] h-[70px] mb-2 text-white">
                            {/* Logo */}
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/80?text=LOGO')} />
                        </div>
                        <span className="text-white text-[16px] leading-[1.1] font-bold tracking-widest text-center uppercase font-sans">
                            TREK GROUP<br />
                            <span className="text-[11px] font-bold tracking-normal opacity-90">{isTrading ? "Trading" : "Contracting"}</span>
                        </span>
                    </div>

                    <div className="text-left text-[14px] font-bold space-y-0.5 pt-4 pr-16 text-[#000]">
                        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">TREK GROUP TRADING CONTRACTING AND SERVICES</h3>
                        <h2 className="text-[20px] font-bold text-black mb-2 tracking-wide uppercase font-['Arial',_Helvetica,_sans-serif]">{title}</h2>
                        <div className="grid grid-cols-[80px_10px_1fr] font-bold">
                            <span>MOB</span><span>:</span><span>+974 3051 6559 / +974 3005 6030<br />&nbsp;&nbsp;+974 4007 0727</span>
                        </div>
                        <div className="grid grid-cols-[80px_10px_1fr] font-bold">
                            <span>EMAIL</span><span>:</span><span>info@trekgroups.com</span>
                        </div>
                        <div className="grid grid-cols-[80px_10px_1fr] font-bold">
                            <span>WEB</span><span>:</span><span>www.trekgroups.com</span>
                        </div>
                        <div className="grid grid-cols-[80px_10px_1fr] font-bold">
                            <span>Location</span><span>:</span><span>Doha -Qatar</span>
                        </div>
                    </div>
                </div>

                {/* The Green/Yellow separator line spanning full width */}
                <div className={`w-full h-1 ${headerColor}`}></div>

                {/* Main Content Info Box */}
                <div className="px-12 py-8 text-[16px] text-black flex flex-col font-bold">

                    {/* Meta Fields (Date, Ref, To) */}
                    <div className="grid gap-y-1 w-[450px]">
                        <div className="grid grid-cols-[100px_20px_1fr]">
                            <span>Date</span><span>:</span><span className="uppercase">{dayStr}<sup className="text-[11px] font-bold">{suffix}</sup> {monthStr}, {yearStr}</span>
                        </div>
                        <div className="grid grid-cols-[100px_20px_1fr]">
                            <span>Ref.</span><span>:</span><span className="uppercase">{quotation.refNo || "TGC/G/JN/054"}</span>
                        </div>
                        <div className="grid grid-cols-[100px_20px_1fr]">
                            <span>To</span><span>:</span><span className="uppercase">{quotation.client?.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Project Field */}
                    <div className="grid grid-cols-[100px_20px_1fr] mt-5 mb-3 uppercase font-bold w-[750px]">
                        <span>PROJECT</span><span>:</span><span>{quotation.project?.toUpperCase()}</span>
                    </div>

                    {/* Greeting & Body */}
                    <div className="space-y-1 font-bold">
                        <p>Dear sir</p>
                        <div className="font-normal text-[16px] pb-1 whitespace-pre-wrap">
                            {quotation.proposalIntro || "With reference to the above-mentioned subject and your inquiry, please find below our final\nrock bottom prices: -"}
                        </div>
                    </div>

                    {/* Quotation Table Wrapper */}
                    <div className="mt-2 font-normal text-[15px] pb-[1px]">
                        <table className="w-full border-collapse border border-black mb-6 text-black">
                            <thead className="bg-[#D3D3DF] font-bold">
                                <tr>
                                    <th className="border border-black px-3 py-1.5 text-center w-[58%]">Product Type</th>
                                    <th className="border border-black px-3 py-1.5 text-center">QTY</th>
                                    <th className="border border-black px-3 py-1.5 text-center">UNIT PRICE</th>
                                    <th className="border border-black px-3 py-1.5 text-center">Unite Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item: QuotationItem, idx: number) => (
                                    <tr key={idx}>
                                        <td className="border border-black px-4 py-2.5 text-[15px] leading-[1.3] whitespace-pre-wrap">
                                            {item.description}
                                        </td>
                                        <td className="border border-black px-3 py-3 text-center align-middle">{item.quantity}</td>
                                        <td className="border border-black px-3 py-3 text-center align-middle">{Number(item.unitPrice).toLocaleString()}</td>
                                        <td className="border border-black px-3 py-3 text-center align-middle">{Number(item.amount || (item.quantity * item.unitPrice)).toLocaleString()}</td>
                                    </tr>
                                ))}

                                {/* Totals Section */}
                                <tr className="font-bold">
                                    <td className="border border-black px-4 py-1.5 uppercase">TOTAL</td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black px-3 py-1.5 text-center">{Number(totalAmount).toLocaleString()}</td>
                                </tr>
                                <tr className="font-bold">
                                    <td className="border border-black px-4 py-1.5 uppercase">DISCOUNT</td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black px-3 py-1.5 text-center">{Number(discount).toLocaleString()}</td>
                                </tr>
                                <tr className="font-bold">
                                    <td className="border border-black px-4 py-1.5 uppercase">NET TOTAL</td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black px-3 py-1.5 text-center">{Number(netTotal).toLocaleString()}</td>
                                </tr>
                                {/* Price in Words Row */}
                                <tr className="bg-[#D3D3DF]">
                                    <td colSpan={4} className="border border-black px-4 py-2 text-center font-bold uppercase tracking-tight text-[14px]">
                                        {numberToWords(netTotal)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Terms & Conditions */}
                        <div className="space-y-1 pb-10">
                            <h3 className="underline font-bold text-[14px] font-['Arial',_Helvetica,_sans-serif]">Terms & Condition:</h3>
                            <div className="text-[13px] font-normal font-['Arial',_Helvetica,_sans-serif] whitespace-pre-wrap leading-[1.4] break-inside-avoid">
                                {quotation.financialTerms || (
                                    <ol className="list-decimal pl-5 space-y-1">
                                        <li><span className="font-bold">Payment:</span> 50% advance, 30% upon delivery, and 20% upon completion</li>
                                        <li><span className="font-bold">Delivery:</span> with 15 days from the advance payment.</li>
                                        <li>Above prices are subjected to change against the significant market prices fluctuation.</li>
                                        <li><span className="font-bold">Offer is valid for 15 Days</span></li>
                                        <li>This quotation is prepared on the basis of the specifications provided in the scope of works and limited to the same.</li>
                                        <li>All scaffolding, electrical connections, and manlift provisions shall be provided by the Client</li>
                                        <li>The above pricing is based on the specifications provided and limited to the quantities stated above. Any variation on the above specifications or quantities will result in change of price and also effect the delivery period. For any changes required to be made other than the scope of works stated, should be made in writing and need written confirmation in order to carry out the same.</li>
                                        <li>We will not be responsible for delivery arising out of delays in approvals of drawings, samples, payments, any natural calamities or pandemics or any situation that is beyond our control.</li>
                                    </ol>
                                )}
                            </div>
                        </div>

                        {/* Signature Row */}
                        <div className="space-y-0.5 break-inside-avoid pb-16">
                            <p className="font-bold text-[15px] mb-1">Best regards,</p>
                            <p className="font-bold text-[15px]">Mr. Afzal</p>
                            <p className="font-bold text-[15px]">{isTrading ? "Manager" : "Contracting Manager"}</p>
                            <p className="font-bold text-[15px]">(+974) 7171 6559</p>
                            <p className="font-bold text-[15px]">Email: info@trekgroups.com</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @media print {
          title { display: none; }
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .p-6, .p-8 { padding: 0 !important; }
          .w-\\[850px\\], .max-w-4xl { 
            width: 210mm !important; 
            max-width: 100% !important; 
            box-shadow: none !important; 
            border: none !important; 
            margin: 0 auto !important;
            display: block !important;
          }
          .bg-\\[\\#e6e4ec\\] { background-color: #e6e4ec !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .bg-\\[\\#2a2944\\] { background-color: #2a2944 !important; color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .bg-\\[\\#8dc63f\\] { background-color: #8dc63f !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .bg-\\[\\#1a1a1a\\] { background-color: #1a1a1a !important; color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .bg-\\[\\#D3D3DF\\] { background-color: #D3D3DF !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .text-\\[\\#000\\] { color: #000 !important; }
          .border-black { border-color: black !important; }
          @page { size: A4 portrait; margin: 10mm; }
        }
      `}</style>
        </div>
    );
}
