import { useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import FormInput from "../../components/forms/FormInput";
import FormSelect from "../../components/forms/FormSelect";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { inventoryService } from "../../services/inventoryService";
import { clientService } from "../../services/clientService";
import { Loader2 } from "lucide-react";
import type { InventoryProduct, SalesOrder } from "../../types/inventory";

function CreateSalesOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch Products for selection
  const { data: products = [], isLoading: productsLoading } = useQuery<InventoryProduct[]>({
    queryKey: ["inventory-products"],
    queryFn: inventoryService.getProducts
  });

  // Fetch Clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientService.getClients()
  });

  // 2. Mutation for creating SO
  const mutation = useMutation({
    mutationFn: (data: Partial<SalesOrder>) => inventoryService.createSalesOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      navigate("/inventory/sales-orders");
    },
    onError: (error: any) => {
      alert(`Sales order submission failed: ${error?.response?.data?.message || error.message || 'Unknown error'}`);
    }
  });

  const [form, setForm] = useState({
    productId: "",
    clientId: "",
    quantity: 0,
    unitPrice: 0,
    status: "Processing" as const
  });

  if (productsLoading || clientsLoading) {
    return (
        <div className="flex flex-col items-center justify-center p-20 animate-pulse text-gray-400">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="font-bold">Loading Data...</p>
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
  const clientOptions = clients.map((c: any) => ({ 
    label: c.contact_person || c.contactPerson || c.name, 
    value: c.id 
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => String(p.id) === String(form.productId));
    if (!product) return alert("Please select a product");

    if (form.quantity > product.stockQuantity) {
        if (!window.confirm("Quantity exceeds current stock. Proceed anyway?")) return;
    }

    const selectedClient = clients.find((c: any) => String(c.id) === String(form.clientId));
    if (!selectedClient) return alert("Please select a client");

    mutation.mutate({
        ...form,
        client: selectedClient.name || "Unknown Client",
        client_id: form.clientId,
        totalAmount: form.quantity * form.unitPrice,
        date: dayjs().format("YYYY-MM-DD")
    } as any);
  };

  return (
    <div className="p-6">
      <PageHeader showBack title="Create Sales Order" subtitle="Record a new customer sale" />

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <FormSelect
          label="Select Client"
          name="clientId"
          value={form.clientId}
          onChange={handleChange}
          options={clientOptions}
          required
        />

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
            label="Unit Selling Price (QAR)"
            type="number"
            name="unitPrice"
            value={form.unitPrice}
            onChange={handleChange}
            required
        />

        <FormSelect
            label="Delivery Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={[
                { label: "Pending Shipment", value: "Pending" },
                { label: "Shipped (Reduce Stock)", value: "Shipped" },
                { label: "Delivered", value: "Delivered" }
            ]}
            required
        />

        <div className="md:col-span-2 p-4 bg-brand-50 rounded-xl border border-brand-100">
            <p className="text-sm font-bold text-brand-900">Projected Revenue</p>
            <p className="text-2xl font-black text-brand-600">QAR {(form.quantity * form.unitPrice).toLocaleString()}</p>
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold">Create Order</button>
          <button type="button" onClick={() => navigate("/inventory/sales-orders")} className="bg-gray-100 text-gray-600 px-6 py-2 rounded-lg font-bold">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default CreateSalesOrder;
