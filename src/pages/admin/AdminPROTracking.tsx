import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Calendar,
  Briefcase,
  ExternalLink,
  Zap,
  ArrowRight,
  X,
  Info,
  Users,
  Edit2
} from "lucide-react";
import PageLoader from "../../components/PageLoader";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { proService } from "../../services/proService";
import { clientService } from "../../services/clientService";
import { exportToCSV } from "../../utils/exportUtils";
import StatCard from "../../components/StatCard";
import { useDivision } from "../../context/DivisionContext";

export default function AdminPROTracking() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeDivision, setActiveDivision } = useDivision();
  const [showDocModal, setShowDocModal] = useState({ open: false, type: "", docs: [] });
  const [selectedClient, setSelectedClient] = useState("All");

  // 1. Fetch Data
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientService.getClients()
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ["pro-contracts"],
    queryFn: () => proService.getContracts()
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["pro-tasks"],
    queryFn: () => proService.getTasks()
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["pro-all-documents"],
    queryFn: () => proService.getAllDocuments()
  });


  // Ensure data variables are arrays to prevent crashes
  const safeClients = Array.isArray(clients) ? clients : [];
  const safeContracts = Array.isArray(contracts) ? contracts : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeDocuments = Array.isArray(documents) ? documents : [];

  // Clients filtered by sector for the dropdown
  const sectorFilteredClients = useMemo(() => {
    if (!activeDivision || activeDivision === "all") return safeClients;
    return safeClients.filter(c => c.division?.toUpperCase() === activeDivision.toUpperCase());
  }, [safeClients, activeDivision]);

  // Reset client filter when sector changes
  useEffect(() => {
    setSelectedClient("All");
  }, [activeDivision]);

  const sectorFilteredContracts = useMemo(() => {
    let base = safeContracts;
    if (activeDivision && activeDivision !== "all") {
      base = base.filter((c: any) =>
        c.sector?.toString().trim().toUpperCase() === activeDivision.toUpperCase() ||
        c.division?.toString().trim().toUpperCase() === activeDivision.toUpperCase()
      );
    }
    
    if (selectedClient !== "All") {
      const search = selectedClient.toString().trim().toUpperCase();
      base = base.filter((c: any) => 
        c.companyName?.toString().trim().toUpperCase() === search || 
        c.clientName?.toString().trim().toUpperCase() === search
      );
    }
    
    return base;
  }, [safeContracts, activeDivision, selectedClient]);

  const filteredContracts = sectorFilteredContracts;

  const totalEmployeesCount = useMemo(() => {
    return sectorFilteredContracts.length;
  }, [sectorFilteredContracts]);

  const activeEmployeesCount = useMemo(() => {
    return sectorFilteredContracts.filter((c: any) => c && (c.status === "Active" || c.status === "Active")).length;
  }, [sectorFilteredContracts]);

  const activeTasks = useMemo(() => {
    const base = safeTasks.filter((t: any) => t && t.status !== "Completed");
    if (!activeDivision || activeDivision === "all") return base;
    return base.filter((t: any) => t.sector?.toLowerCase() === activeDivision.toLowerCase());
  }, [safeTasks, activeDivision]);

  const pendingTasks = useMemo(() => activeTasks.filter((t: any) => t && t.status === "Pending"), [activeTasks]);
  const highPriorityTasks = useMemo(() => activeTasks.filter((t: any) => t && t.priority === "High" && t.status !== "Completed"), [activeTasks]);

  const expiringSoonDocs = useMemo(() => {
    let base = safeDocuments.filter((d: any) => d && d.status === "Expiring Soon");
    if (activeDivision && activeDivision !== "all") {
      base = base.filter((d: any) => 
        d.sector?.toString().trim().toUpperCase() === activeDivision.toUpperCase() ||
        d.division?.toString().trim().toUpperCase() === activeDivision.toUpperCase()
      );
    }
    if (selectedClient !== "All") {
      const search = selectedClient.toString().trim().toUpperCase();
      base = base.filter((d: any) => 
        d.companyName?.toString().trim().toUpperCase() === search || 
        d.clientName?.toString().trim().toUpperCase() === search
      );
    }
    return base;
  }, [safeDocuments, activeDivision, selectedClient]);

  const expiredDocs = useMemo(() => {
    let base = safeDocuments.filter((d: any) => d && d.status === "Expired");
    if (activeDivision && activeDivision !== "all") {
      base = base.filter((d: any) => 
        d.sector?.toString().trim().toUpperCase() === activeDivision.toUpperCase() ||
        d.division?.toString().trim().toUpperCase() === activeDivision.toUpperCase()
      );
    }
    if (selectedClient !== "All") {
      const search = selectedClient.toString().trim().toUpperCase();
      base = base.filter((d: any) => 
        d.companyName?.toString().trim().toUpperCase() === search || 
        d.clientName?.toString().trim().toUpperCase() === search
      );
    }
    return base;
  }, [safeDocuments, activeDivision, selectedClient]);


  const handleGenerateReport = () => {
    const dataForExport = safeDocuments.map((d: any) => ({
      "Document Name": d.name,
      "Client": d.clientName,
      "Expiry Date": d.expiryDate,
      "Status": d.status,
      "Category": d.category
    }));
    exportToCSV(dataForExport, "compliance_report.csv");
  };

  const viewClientDetails = (clientId: string) => {
    navigate(`/client-details/${clientId}`);
  };

  if (clientsLoading || contractsLoading || tasksLoading || docsLoading) {
    return <PageLoader message="Aggregating Global Compliance Data..." />;
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-lg border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-brand-600" size={32} />
            Employee PRO Tracking
          </h1>
          <p className="text-slate-500 font-medium mt-1">Monitoring employee QID, Passport, and other critical compliance documents</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={totalEmployeesCount.toString()}
          icon={<Users className="text-brand-600" size={20} />}
          trend={{ value: "Staff Tracked", positive: true }}
          path="/employees/list"
        />
        <StatCard
          title="Active Employees"
          value={activeEmployeesCount.toString()}
          icon={<Users className="text-brand-600" size={20} />}
          trend={{ value: "Current Active", positive: true }}
        />
        <StatCard
          title="Expiring Documents"
          value={expiringSoonDocs.length.toString()}
          icon={<AlertTriangle className="text-orange-500" size={20} />}
          trend={{ value: "Action Required", positive: false }}
          onClick={() => setShowDocModal({ open: true, type: "Expiring Soon", docs: expiringSoonDocs })}
        />
        <StatCard
          title="Expired Documents"
          value={expiredDocs.length.toString()}
          icon={<AlertTriangle className="text-rose-500" size={20} />}
          trend={{ value: "Critical Alerts", positive: false }}
          onClick={() => setShowDocModal({ open: true, type: "Expired", docs: expiredDocs })}
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col gap-1 flex-1 max-w-xs">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter by Client</label>
            <select 
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="All">All Clients</option>
              {sectorFilteredClients.map(client => (
                <option key={client.id} value={client.name}>{client.name} ({client.contactPerson || 'No Contact'})</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col gap-1 flex-1 max-w-xs">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Company</label>
            <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-500 min-h-[38px] flex items-center italic">
              {selectedClient === "All" ? "Select a client to manage employees" : selectedClient}
            </div>
          </div>
        </div>

        {selectedClient !== "All" && (
          <button 
            onClick={() => {
              const params = new URLSearchParams();
              params.append("company", selectedClient);
              params.append("from", "pro-tracking"); // Tracking source for return redirect
              
              // Find the client's division to pre-fill
              const client = safeClients.find(c => c.name === selectedClient);
              if (client?.division) {
                params.append("division", client.division);
              } else if (activeDivision !== "all") {
                params.append("division", activeDivision);
              }
              
              navigate(`/employees/create?${params.toString()}`);
            }}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 shrink-0 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300"
          >
            <Users size={14} /> Add Employee to {selectedClient}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Contracts List */}
        <div className="lg:col-span-12 space-y-8">
          <div className="bg-white border border-slate-100 rounded-lg overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Document Tracking</h2>
              </div>
              <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-[10px] font-black">{filteredContracts.length} Total Staff</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee / Division</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredContracts.length > 0 ? filteredContracts.map((contract: any) => {
                    return (
                      <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                              {contract.title?.charAt(0) || "E"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{contract.title || "Unknown Employee"}</p>
                              <p className="text-[10px] text-slate-400 font-medium uppercase">{contract.sector}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <p className="text-sm font-semibold text-slate-700">{contract.role || "Staff"}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{contract.companyName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${contract.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            }`}>
                            {contract.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => navigate(`/employees/edit/${contract.id}`)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => navigate(`/employees/details/${contract.id}`)}
                              className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                              title="View Details"
                            >
                              <ArrowRight size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                           <Users className="text-slate-200" size={48} />
                           <p className="text-slate-400 font-bold">No staff records found for {selectedClient === "All" ? "any client" : selectedClient}</p>
                           {selectedClient !== "All" && (
                             <p className="text-xs text-slate-400">Click 'Add Employee' above to register new staff for this company.</p>
                           )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>


      {/* Document Detail Modal */}
      {showDocModal.open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-6 flex items-center justify-between border-b ${showDocModal.type === 'Expired' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${showDocModal.type === 'Expired' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{showDocModal.type} Documents</h2>
                  <p className="text-slate-500 text-xs font-semibold">{showDocModal.docs.length} critical items require immediate attention</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocModal({ open: false, type: "", docs: [] })}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee / Division</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Details</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Joining Info</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {showDocModal.docs.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-sm">{doc.clientName}</p>
                          <p className="text-[10px] text-slate-400 font-medium mb-1">{doc.companyName}</p>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[9px] font-bold uppercase tracking-wider">{doc.sector || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700 text-sm italic">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.number}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-semibold text-slate-600">Joined: {doc.contractStartDate ? dayjs(doc.contractStartDate).format("DD MMM, YYYY") : "N/A"}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <p className={`font-black text-sm ${showDocModal.type === 'Expired' ? 'text-rose-600' : 'text-amber-600'}`}>
                            {dayjs(doc.expiryDate).format("DD MMM, YYYY")}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">{dayjs(doc.expiryDate).fromNow()}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-400">
                <Info size={14} />
                <p className="text-[10px] font-medium leading-none">Automated expiry tracking based on 30-day window.</p>
              </div>
              <button
                onClick={() => setShowDocModal({ open: false, type: "", docs: [] })}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-800 transition-all"
              >
                Close Detail View
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
