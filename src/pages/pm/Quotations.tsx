import { useState, useMemo, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import ApprovalBadge from "../../components/ApprovalBadge";
import { Plus, Eye, Trash2, Edit } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useActivity } from "../../context/ActivityContext";
import { useDivision } from "../../context/DivisionContext";
import { DIVISIONS } from "../../constants/divisions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotationService } from "../../services/quotationService";
import { financeService } from "../../services/financeService";

type TableRow = Record<string, string | number | boolean | ReactNode | null | undefined>;

function Quotations() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { activeDivision } = useDivision();
  const { logActivity } = useActivity();
  const [activeTab, setActiveTab] = useState<"quotations" | "invoices">("quotations");

  useEffect(() => {
    setActiveTab(location.pathname.startsWith("/invoices") ? "invoices" : "quotations");
  }, [location.pathname]);

  // Quotations Query
  const { data: quotations = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ["quotations"],
    queryFn: quotationService.getQuotations
  });

  // Invoices Query
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: financeService.getInvoices
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: quotationService.deleteQuotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      logActivity("Deleted Quotation", "project", "/quotations");
    }
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: financeService.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      logActivity("Deleted Invoice", "finance", "/quotations");
    }
  });

  const handleDeleteQuote = useCallback((id: string) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      deleteQuoteMutation.mutate(id, {
        onError: (err) => {
          alert(`Failed to delete: ${err.message}`);
        }
      });
    }
  }, [deleteQuoteMutation]);

  const toggleInvoiceStatus = useCallback(async (id: string, currentStatus: string, invoiceNo: string) => {
    const isPaid = currentStatus?.toUpperCase() === "PAID";
    const newStatus = isPaid ? "Unpaid" : "Paid";
    if (window.confirm(`Mark invoice ${invoiceNo} as ${newStatus}?`)) {
      try {
        await financeService.updatePaymentStatus(id, newStatus as any);
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        logActivity(`Marked Invoice ${invoiceNo} as ${newStatus}`, "finance", "/quotations", invoiceNo);
      } catch (err) {
        console.error("Error updating invoice status:", err);
        alert("Failed to update status");
      }
    }
  }, [logActivity, queryClient]);

  const handleDeleteInvoice = useCallback((id: string) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      deleteInvoiceMutation.mutate(id, {
        onError: (err) => {
          alert(`Failed to delete: ${err.message}`);
        }
      });
    }
  }, [deleteInvoiceMutation]);

  const tableData = useMemo<TableRow[]>(() => {
    if (activeTab === "quotations") {
      // Use the quotations fetched from backend
      const filtered = quotations.filter((item: any) => {
        if (activeDivision === "all") return true;
        const branchLower = (item.division || "CONTRACTING").toUpperCase();
        
        if (activeDivision === "SERVICE") {
            return branchLower === "SERVICE" || branchLower === "BUSINESS";
        }
        return branchLower === activeDivision;
      });

      return filtered.map((item: any) => ({
        id: item.id,
        "Quote ID": item.qtn_number || item["Quote ID"] || item.id,
        "Project": item.project_name || item.project || "-",
        "Client": item.client_name || item.client,
        "Sector": (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                (item.division?.toLowerCase() === 'service' || item.division?.toLowerCase() === 'business') ? 'bg-amber-100 text-amber-600' :
                item.division?.toLowerCase() === 'trading' ? 'bg-emerald-100 text-emerald-600' :
                'bg-blue-100 text-blue-600'
            }`}>
                {item.division?.toLowerCase() === 'business' ? 'Service' : (item.division || 'Contracting')}
            </span>
        ),
        "Amount": `QAR ${Number(item.total_amount || item.netTotal || item.amount || 0).toLocaleString()}`,
        "Expiry Date": item.valid_until ? new Date(item.valid_until).toLocaleDateString() : "-",
        "Approval": <ApprovalBadge status={item.status || "pending"} />,
        "Actions": (
          <div className="flex gap-2">
            <Link to={`/quotation-details/${item["Quote ID"] || item.id}`} className="p-1 text-slate-400 hover:text-brand-600 transition-colors">
              <Eye size={16} />
            </Link>
            <Link to={`/edit-quotation/${item["Quote ID"] || item.id}`} className="p-1 text-slate-400 hover:text-brand-600 transition-colors">
                <Edit size={16} />
            </Link>

            <button
              onClick={() => handleDeleteQuote(String(item["Quote ID"] || item.id))}
              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )
      }));
    } else {
      // Invoices from database
      const filtered = invoices.filter((item: any) => {
        if (activeDivision === "all") return true;
        const branchLower = (item.division || item.branch || "CONTRACTING").toUpperCase();
        
        if (activeDivision === "SERVICE") {
            return branchLower === "SERVICE" || branchLower === "BUSINESS";
        }
        return branchLower === activeDivision;
      });

      const sorted = [...filtered].sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      return sorted.map((invoice: any) => ({
        id: invoice.id,
        "Invoice No": invoice.invoice_number || invoice.invoiceNo,
        "Client": invoice.client_name || invoice.client,
        "Sector": (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                (invoice.division?.toLowerCase() === 'service' || invoice.branch?.toLowerCase() === 'service' || invoice.branch?.toLowerCase() === 'business') ? 'bg-amber-100 text-amber-600' :
                (invoice.division?.toLowerCase() === 'trading' || invoice.branch?.toLowerCase() === 'trading') ? 'bg-emerald-100 text-emerald-600' :
                'bg-blue-100 text-blue-600'
            }`}>
                {invoice.branch?.toLowerCase() === 'business' ? 'Service' : (invoice.division || invoice.branch || 'Contracting')}
            </span>
        ),
        "Ref Type": invoice.ref_type || invoice.refType || "General",
        "Ref No": invoice.reference_number || invoice.ref_no || invoice.refNo || "-",
        "Amount": `QAR ${Number(invoice.total_amount || invoice.amount || 0).toLocaleString()}`,
        "Status": <StatusBadge status={invoice.status} />,
        "Approval": <ApprovalBadge status={invoice.approval_status || invoice.approvalStatus || "approved"} />,
        "Date": invoice.invoice_date || invoice.date || invoice.createdAt || "-",
        "Actions": (
          <div className="flex gap-2 items-center">
            <Link to={`/invoice-details/${invoice.id}`} title="View" className="p-1 text-slate-400 hover:text-brand-600 transition-colors">
              <Eye size={16} />
            </Link>
            <Link to={`/edit-invoice/${invoice.id}`} title="Edit" className="p-1 text-slate-400 hover:text-brand-600 transition-colors">
                <Edit size={16} />
            </Link>
            <button
              onClick={() => handleDeleteInvoice(invoice.id)}
              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )
      }));
    }
  }, [activeDivision, activeTab, quotations, handleDeleteInvoice, handleDeleteQuote, toggleInvoiceStatus]);

  const currentDivision = DIVISIONS.find(d => d.id === activeDivision);
  const typeLabel = activeTab === "quotations" ? "Quotations" : "Invoices";
  const currentTitle = activeDivision === "all" ? `All ${typeLabel}` : `${currentDivision?.label} ${typeLabel}`;

  const quoteColumns = ["Quote ID", "Project", "Client", "Sector", "Amount", "Approval", "Expiry Date", "Actions"];
  const invoiceColumns = ["Invoice No", "Client", "Sector", "Ref Type", "Ref No", "Amount", "Status", "Approval", "Date", "Actions"];

  return (
    <>
      <PageHeader
        title={currentTitle}
        subtitle={`Manage and track ${activeTab} across sectors`}
        showBack={true}
        action={
          <div className="flex gap-3">
            {activeTab === "quotations" ? (
              <button
                onClick={() => navigate("/create-quotation")}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={16} />
                Create Quotation
              </button>
            ) : (
              <button
                onClick={() => navigate("/create-invoice")}
                className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus size={16} />
                Create Invoice
              </button>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 min-h-[300px]">
        {(activeTab === "quotations" ? loadingQuotes : loadingInvoices) ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            Loading {activeTab}...
          </div>
        ) : (
          <DataTable columns={activeTab === "quotations" ? quoteColumns : invoiceColumns} data={tableData} />
        )}
      </div>
    </>
  );
}

export default Quotations;
