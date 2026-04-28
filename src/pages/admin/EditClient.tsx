import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DocumentUpload from "../../components/DocumentUpload";
import MiniFileUpload from "../../components/forms/MiniFileUpload";
import DivisionTiles from "../../components/forms/DivisionTiles";
import type { DivisionId } from "../../constants/divisions";
import type { License } from "../../types/client";
import { ArrowLeft, Trash2, Plus, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService } from "../../services/clientService";
import dayjs from "dayjs";

function EditClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState({
    name: "", // Contact Person in CreateClient
    company: "", // Company Name in CreateClient
    email: "",
    phone: "",
    contractType: "Monthly PRO",
    division: "service" as DivisionId,
    startDate: "",
    renewalDate: "",
    address: "",
    qid: "",
    crNumber: "",
    computerCard: "",
  });

  const [licenses, setLicenses] = useState<License[]>([]);

  // File states for new uploads
  const [qidFile, setQidFile] = useState<File | null>(null);
  const [crFile, setCrFile] = useState<File | null>(null);
  const [compCardFile, setCompCardFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Existing file URLs
  const [existingDocs, setExistingDocs] = useState({
    qidDocUrl: "",
    crDocUrl: "",
    computerCardDocUrl: "",
    contractDocUrl: "",
  });

  // 1. Fetch Client Data
  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientService.getClient(id!),
    enabled: !!id
  });

  // 2. Sync fetched data with local form state
  useEffect(() => {
    if (client) {
      setForm({
        name: client.contactPerson || "",
        company: client.companyName || client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        contractType: client.contractType || "Monthly PRO",
        division: (client.division as DivisionId) || "service",
        startDate: client.startDate ? dayjs(client.startDate).format("YYYY-MM-DD") : "",
        renewalDate: client.renewalDate ? dayjs(client.renewalDate).format("YYYY-MM-DD") : "",
        address: client.address || "",
        qid: client.qid || "",
        crNumber: client.crNumber || "",
        computerCard: client.computerCard || "",
      });
      setExistingDocs({
        qidDocUrl: client.qidDocUrl || "",
        crDocUrl: client.crDocUrl || "",
        computerCardDocUrl: client.computerCardDocUrl || "",
        contractDocUrl: client.contractDocUrl || "",
      });
      setLicenses(client.licenses?.map((l: any) => ({ 
        type: l.licenseType || l.licenseName || "Trade License", 
        number: l.licenseNumber || l.number || "", 
        expiryDate: l.expiryDate ? dayjs(l.expiryDate).format("YYYY-MM-DD") : "",
        documentUrl: l.documentUrl || ""
      })) || [{ type: "Trade License", number: "", expiryDate: "" }]);
    }
  }, [client]);

  // 3. Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => clientService.updateClient(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      alert("Client profile updated successfully");
      navigate(`/client-details/${id}`);
    },
    onError: (error: any) => {
      alert(`Update failed: ${error.message}`);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleLicenseChange = (index: number, field: keyof License, value: any) => {
    const newLicenses = [...licenses];
    newLicenses[index] = { ...newLicenses[index], [field]: value };
    setLicenses(newLicenses);
  };

  const addLicense = () => {
    setLicenses([...licenses, { type: "", number: "", expiryDate: "" }]);
  };

  const removeLicense = (index: number) => {
    if (licenses.length > 1) {
      setLicenses(licenses.filter((_: License, i: number) => i !== index));
    }
  };

  const handleDivisionChange = (newId: any) => {
    setForm({ ...form, division: newId as DivisionId });
  };

  const uploadFile = async (file: File, module: string) => {
    const formData = new FormData();
    formData.append("files", file);
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/upload?module=${module}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const result = await res.json();
    return result.success ? result.data[0].url : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let qidDocUrl = existingDocs.qidDocUrl;
    let crDocUrl = existingDocs.crDocUrl;
    let computerCardDocUrl = existingDocs.computerCardDocUrl;
    let contractDocUrl = existingDocs.contractDocUrl;

    try {
      if (qidFile) qidDocUrl = await uploadFile(qidFile, "legal");
      if (crFile) crDocUrl = await uploadFile(crFile, "legal");
      if (compCardFile) computerCardDocUrl = await uploadFile(compCardFile, "legal");
      if (contractFile) contractDocUrl = await uploadFile(contractFile, "contracts");

      const updatedLicenses = [...licenses];
      for (let i = 0; i < updatedLicenses.length; i++) {
        if (updatedLicenses[i].file) {
          updatedLicenses[i].documentUrl = await uploadFile(updatedLicenses[i].file as File, "licenses");
        }
      }

      let newSupportingDocs: any[] = [];
      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        uploadedFiles.forEach((f) => formData.append("files", f));
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/upload?module=general", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const result = await res.json();
        if (result.success) newSupportingDocs = result.data;
      }

      const payload = {
        companyName: form.company, 
        email: form.email,
        phone: form.phone,
        address: form.address,
        contactPerson: form.name,
        division: form.division,
        qid: form.qid,
        crNumber: form.crNumber,
        computerCard: form.computerCard,
        contractType: form.contractType,
        startDate: form.startDate,
        renewalDate: form.renewalDate,
        qidDocUrl,
        crDocUrl,
        computerCardDocUrl,
        contractDocUrl,
        licenses: updatedLicenses.map(l => ({
          type: l.type,
          number: l.number,
          expiryDate: l.expiryDate,
          documentUrl: l.documentUrl
        })),
        documents: newSupportingDocs // Sent to backend to be added to agreements
      };

      updateMutation.mutate(payload);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to upload documents or update client.");
    }
  };

  if (isLoading) return <div className="p-6">Loading client profile...</div>;

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 bg-white rounded-full transition-colors shadow-sm">
              <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Edit Client Profile</h1>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm max-w-4xl space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <DivisionTiles 
            label="Select Division / Sector" 
            selectedId={form.division} 
            onChange={handleDivisionChange} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
            <div className="col-span-2">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Basic Information</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person *</label>
              <input
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
              <input
                required
                name="company"
                value={form.company}
                onChange={handleChange}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
              <input
                required
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <textarea
                name="address"
                rows={2}
                value={form.address}
                onChange={handleChange}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Full Office Address"
              />
            </div>

            <div className="col-span-2">
              <h3 className="text-lg font-bold text-slate-800 mt-4 mb-4 border-b pb-2">Business Documents</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qatar ID (QID)</label>
                <input
                  name="qid"
                  value={form.qid}
                  onChange={handleChange}
                  className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <MiniFileUpload 
                label="Update QID Document" 
                selectedFile={qidFile} 
                onFileSelect={setQidFile} 
              />
              {existingDocs.qidDocUrl && (
                <a href={existingDocs.qidDocUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">View Current QID Document</a>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CR Number</label>
                <input
                  name="crNumber"
                  value={form.crNumber}
                  onChange={handleChange}
                  className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <MiniFileUpload 
                label="Update CR Document" 
                selectedFile={crFile} 
                onFileSelect={setCrFile} 
              />
              {existingDocs.crDocUrl && (
                <a href={existingDocs.crDocUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">View Current CR Document</a>
              )}
            </div>

            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Computer Card</label>
                  <input
                    name="computerCard"
                    value={form.computerCard}
                    onChange={handleChange}
                    className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                </div>
                {existingDocs.computerCardDocUrl && (
                  <a href={existingDocs.computerCardDocUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline block">View Current Computer Card</a>
                )}
              </div>
              <MiniFileUpload 
                label="Update Computer Card" 
                selectedFile={compCardFile} 
                onFileSelect={setCompCardFile} 
              />
            </div>

            <div className="col-span-2">
              <h3 className="text-lg font-bold text-slate-800 mt-4 mb-4 border-b pb-2">Contract Details</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contract Type</label>
              <select
                name="contractType"
                value={form.contractType}
                onChange={handleChange}
                className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="Monthly PRO">Monthly PRO</option>
                <option value="Project Contract">Project Contract</option>
                <option value="Trading Customer">Trading Customer</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Renewal Date</label>
                  <input
                    type="date"
                    name="renewalDate"
                    value={form.renewalDate}
                    onChange={handleChange}
                    className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                  />
                </div>
                <div className="col-span-2">
                  {existingDocs.contractDocUrl && (
                    <a href={existingDocs.contractDocUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">View Current Contract Document</a>
                  )}
                </div>
              </div>
              <MiniFileUpload 
                label="Update Contract Document" 
                selectedFile={contractFile} 
                onFileSelect={setContractFile} 
              />
            </div>

            <div className="col-span-2 space-y-4 pt-4 border-t border-slate-50">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-slate-800">Licenses *</label>
                <button type="button" onClick={addLicense} className="text-brand-600 text-xs font-bold hover:underline">
                  + Add Another License
                </button>
              </div>
              
              {licenses.map((license: License, index: number) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 relative group">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">License Type</label>
                    <input
                      value={license.type}
                      onChange={(e) => handleLicenseChange(index, "type", e.target.value)}
                      className="w-full border border-slate-200 p-2 rounded-lg text-sm"
                      placeholder="e.g. Trade License"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Number</label>
                    <input
                      required
                      value={license.number}
                      onChange={(e) => handleLicenseChange(index, "number", e.target.value)}
                      className="w-full border border-slate-200 p-2 rounded-lg text-sm"
                      placeholder="License Number"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={license.expiryDate}
                      onChange={(e) => handleLicenseChange(index, "expiryDate", e.target.value)}
                      className="w-full border border-slate-200 p-2 rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <MiniFileUpload 
                      label="Update License Document" 
                      selectedFile={license.file as File || null} 
                      onFileSelect={(file) => handleLicenseChange(index, "file", file)} 
                    />
                    {license.documentUrl && (
                      <a href={license.documentUrl as string} target="_blank" rel="noreferrer" className="text-[10px] text-brand-600 hover:underline mt-1 block">View Existing License File</a>
                    )}
                  </div>
                  {licenses.length > 1 && (
                    <button type="button" onClick={() => removeLicense(index)} className="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1 rounded-full shadow-sm hover:bg-red-200 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="col-span-2 pt-4">
              <label className="block text-sm font-bold text-slate-800 mb-4">Other Agreement Documents</label>
              <DocumentUpload onChange={setUploadedFiles} />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-semibold">Cancel</button>
            <button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="px-10 py-2.5 bg-brand-600 text-white rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default EditClient;
