import { useState } from "react";
import type { ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/PageHeader";
import FormInput from "../../components/forms/FormInput";
import FormSelect from "../../components/forms/FormSelect";
import { inventoryService } from "../../services/inventoryService";
import { purchaseService } from "../../services/purchaseService";
import { Loader2 } from "lucide-react";
import dayjs from "dayjs";
import type { InventoryProduct, PurchaseOrder } from "../../types/inventory";

function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const initialProductId = queryParams.get("productId") || "";

  // 1. Fetch products for selection
  const { data: products = [] } = useQuery<InventoryProduct[]>({
    queryKey: ["products"],
    queryFn: inventoryService.getProducts
  });
  
  const [form, setForm] = useState({
    productId: initialProductId,
    quantity: 0,
    unitPrice: 0,
    status: "Pending" as PurchaseOrder["status"]
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const productOptions = products.map(p => ({ label: p.name, value: p.id }));

  // 2. Mutation for PO creation
  const mutation = useMutation({
    mutationFn: (data: Partial<PurchaseOrder>) => purchaseService.createPurchaseOrder(data as any),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        queryClient.invalidateQueries({ queryKey: ["products"] }); // Stock might have updated if status was 'Received'
        navigate("/inventory/purchase-orders");
    },
    onError: (error: Error) => {
        alert(`Failed to create PO: ${error.message || 'Unknown error'}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => String(p.id) === String(form.productId));
    if (!product) return alert("Please select a product");

    mutation.mutate({
        ...form,
        supplier: "Unknown Supplier", // Default for now
        totalAmount: form.quantity * form.unitPrice,
        date: dayjs().format("YYYY-MM-DD")
    } as any);
  };

  return (
    <div className="p-6">
      <PageHeader showBack title="Create Purchase Order" subtitle="Initiate a new stock procurement" />

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <FormSelect
          label="Select Product"
          name="productId"
          value={form.productId}
          onChange={handleChange}
          options={productOptions}
          required
        />

        <FormInput
            label="Quantity"
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            required
        />

        <FormInput
            label="Unit Price (QAR)"
            type="number"
            name="unitPrice"
            value={form.unitPrice}
            onChange={handleChange}
            required
        />

        <FormSelect
            label="Order Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={[
                { label: "Pending Approval", value: "Pending" },
                { label: "Received (Update Stock)", value: "Received" }
            ]}
            required
        />

        <div className="md:col-span-2 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm font-bold text-blue-900">Total Calculation</p>
            <p className="text-2xl font-black text-blue-600">QAR {(form.quantity * form.unitPrice).toLocaleString()}</p>
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="bg-brand-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-brand-700 transition flex items-center gap-2 disabled:opacity-70"
          >
            {mutation.isPending ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving PO...
                </>
            ) : "Save PO"}
          </button>
          <button 
            type="button" 
            onClick={() => navigate("/inventory/purchase-orders")} 
            className="bg-slate-100 text-slate-600 px-8 py-2.5 rounded-lg font-bold hover:bg-slate-200 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePurchaseOrder;
