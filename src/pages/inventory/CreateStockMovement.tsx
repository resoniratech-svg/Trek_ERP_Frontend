import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import FormInput from "../../components/forms/FormInput";
import FormSelect from "../../components/forms/FormSelect";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { inventoryService } from "../../services/inventoryService";
import { Loader2 } from "lucide-react";
import type { InventoryProduct, InventoryMovement } from "../../types/inventory";

function CreateStockMovement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch Products
  const { data: products = [], isLoading: productsLoading } = useQuery<InventoryProduct[]>({
    queryKey: ["inventory-products"],
    queryFn: inventoryService.getProducts
  });

  // 2. Mutation
  const mutation = useMutation({
    mutationFn: (data: Partial<InventoryMovement>) => inventoryService.createMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      navigate("/inventory-movements");
    }
  });

  const [form, setForm] = useState({
    productId: "",
    type: "IN" as InventoryMovement["type"],
    quantity: 0,
    reason: ""
  });

  if (productsLoading) {
    return (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse text-gray-400">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="font-bold">Accessing Stock Ledger...</p>
        </div>
    );
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const productOptions = products.map((p) => ({ label: p.name, value: p.id }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === form.productId);
    if (!product) return alert("Please select a product");

    mutation.mutate({
        ...form,
        productName: product.name,
        notes: form.reason,
        date: dayjs().format("YYYY-MM-DD")
    } as any);
  };

  return (
    <div className="p-6">
      <PageHeader showBack 
        title="Stock Movement" 
        subtitle="Record manual stock additions, reductions, or adjustments" 
      />

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <FormSelect
          label="Select Product"
          name="productId"
          value={form.productId}
          onChange={handleChange}
          options={productOptions}
          required
        />

        <FormSelect
          label="Movement Type"
          name="type"
          value={form.type}
          onChange={handleChange}
          options={[
              { label: "Stock In (Purchase/Restock)", value: "IN" },
              { label: "Stock Out (Sales/Used)", value: "OUT" },
              { label: "Adjustment (Manual Overwrite)", value: "ADJUSTMENT" }
          ]}
          required
        />

        <FormInput
          label={form.type === 'ADJUSTMENT' ? "New Total Count" : "Quantity"}
          type="number"
          name="quantity"
          value={form.quantity}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Reason / Reference"
          name="reason"
          value={form.reason}
          onChange={handleChange}
          placeholder="e.g. PO #101, Damage, Correction"
          required
        />

        <div className="col-span-1 md:col-span-2 flex gap-3">
            <button 
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
            >
                Save Movement
            </button>
            <button 
                type="button"
                onClick={() => navigate("/inventory-movements")}
                className="bg-gray-100 text-gray-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition"
            >
                Cancel
            </button>
        </div>
      </form>
    </div>
  );
}

export default CreateStockMovement;