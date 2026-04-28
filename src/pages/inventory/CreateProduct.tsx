import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FormTextarea from "../../components/forms/FormTextarea";
import FormInput from "../../components/forms/FormInput";
import FormSelect from "../../components/forms/FormSelect";
import PageHeader from "../../components/PageHeader";
import { inventoryService } from "../../services/inventoryService";
import { useDivision } from "../../context/DivisionContext";
import { Loader2 } from "lucide-react";
import type { InventoryProduct } from "../../types/inventory";

const SECTOR_OPTIONS = {
  all: {
    categories: ["Construction", "Maintenance", "Consulting", "Electronics", "Furniture", "Cleaning", "IT Services", "General"],
    products: ["Glass Panel", "Cement Bag", "Copper Wire", "AC Repair", "Strategy Consulting", "Laptop", "Desk Chair", "Other"]
  },
  SERVICE: {
    categories: ["Maintenance", "Consulting", "Cleaning", "IT Services", "General"],
    products: ["AC Repair", "Strategy Consulting", "Deep Cleaning", "Server Maintenance", "Software License", "Plumbing Service", "Electrical Repair", "Other"]
  },
  TRADING: {
    categories: ["Electronics", "Furniture", "Apparel", "Office Supplies", "Hardware", "General"],
    products: ["Laptop", "Desk Chair", "Monitor", "Printer", "Safety Gear", "Power Drill", "Office Desk", "Other"]
  },
  CONTRACTING: {
    categories: ["Construction Materials", "Plumbing", "Electrical", "Heavy Machinery", "Tools", "General"],
    products: ["Glass Panel", "Cement Bag", "Copper Wire", "PVC Pipe", "Steel Rebar", "Excavator Rental", "Scaffolding", "Other"]
  }
};

function CreateProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { activeDivision } = useDivision();

  const isEdit = Boolean(id);

  const [selectedSector, setSelectedSector] = useState<string>(activeDivision !== 'all' ? activeDivision : 'SERVICE');

  const [form, setForm] = useState<Partial<InventoryProduct>>({
    name: "",
    purchasePrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    minStock: 0,
    category: "",
    description: "",
    division: activeDivision !== 'all' ? activeDivision : 'SERVICE'
  });

  // 1. Fetch product if editing
  const { data: product, isLoading: isFetching } = useQuery<InventoryProduct>({
    queryKey: ["product", id],
    queryFn: () => inventoryService.getProduct(id!),
    enabled: isEdit && !!id
  });

  // Sync form when product data loads
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        minStock: product.minStock,
        category: product.category || "",
        description: product.description || "",
        division: product.division || "SERVICE"
      });
      if (product.division) setSelectedSector(product.division);
    }
  }, [product]);

  // 2. Mutation for create/update
  const mutation = useMutation({
    mutationFn: (data: Partial<InventoryProduct>) => isEdit ? inventoryService.updateProduct(id!, data) : inventoryService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (isEdit) queryClient.invalidateQueries({ queryKey: ["product", id] });
      navigate("/products");
    },
    onError: (error: Error) => {
      alert(`Failed to ${isEdit ? 'update' : 'create'} product: ${error.message || 'Unknown error'}`);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'number' ? Number(value) || 0 : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const currentOptions = SECTOR_OPTIONS[selectedSector as keyof typeof SECTOR_OPTIONS] || SECTOR_OPTIONS.all;

  return (
    <div className="p-6">
      <PageHeader showBack
        title={isEdit ? "Edit Product" : "Create Product"}
        subtitle={isEdit ? `Modifying ${form.name}` : "Add a new item to the inventory"}
      />

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        <div className="col-span-1 md:col-span-2 flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <label className="text-sm text-gray-700 font-bold uppercase tracking-wider">Target Sector Overview</label>
          <p className="text-xs text-gray-500 mb-2">Select the sector to load specific product and category suggestions.</p>
          <select
            value={selectedSector}
            onChange={(e) => {
              setSelectedSector(e.target.value);
              setForm({ ...form, division: e.target.value });
            }}
            className="border border-gray-200 rounded-xl px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium text-brand-700 shadow-sm max-w-sm"
          >
            <option value="SERVICE">Service Sector</option>
            <option value="TRADING">Trading Sector</option>
            <option value="CONTRACTING">Contracting Sector</option>
            <option value="all">All Sectors (Combined)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 font-medium">Product Name <span className="text-red-500">*</span></label>
          <div className="flex flex-col xl:flex-row gap-2">
            <select
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium text-gray-700 shadow-sm flex-1 min-w-0"
            >
              <option value="" disabled hidden>Select from list...</option>
              {currentOptions.products.filter(p => p !== 'Other').map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="self-center text-xs text-gray-400 font-bold whitespace-nowrap hidden xl:block uppercase">OR</span>
            <input
              type="text"
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              placeholder="Type manual entry..."
              required
              className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 text-sm flex-1 min-w-0"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600 font-medium">Category</label>
          <div className="flex flex-col xl:flex-row gap-2">
            <select
              value={form.category || ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium text-gray-700 shadow-sm flex-1 min-w-0"
            >
              <option value="" disabled hidden>Select category...</option>
              {currentOptions.categories.filter(c => c !== 'Other' && c !== 'General').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="self-center text-xs text-gray-400 font-bold whitespace-nowrap hidden xl:block uppercase">OR</span>
            <input
              type="text"
              name="category"
              value={form.category || ""}
              onChange={handleChange}
              placeholder="Type manual entry..."
              className="border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 text-sm flex-1 min-w-0"
            />
          </div>
        </div>

        <FormInput
          label="Purchase Price (QAR)"
          type="number"
          name="purchasePrice"
          value={form.purchasePrice || 0}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Selling Price (QAR)"
          type="number"
          name="sellingPrice"
          value={form.sellingPrice || 0}
          onChange={handleChange}
          required
        />

        <FormInput
          label="Initial Stock Quantity"
          type="number"
          name="stockQuantity"
          value={form.stockQuantity || 0}
          onChange={handleChange}
          required
          disabled={isEdit} // Use movements for stock changes in edit mode
        />

        <FormInput
          label="Minimum Stock Level (Alert Threshold)"
          type="number"
          name="minStock"
          value={form.minStock || 0}
          onChange={handleChange}
          required
        />

        <div className="col-span-1 md:col-span-2">
          <FormTextarea
            label="Description"
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            placeholder="Product details..."
          />
        </div>

        <div className="col-span-1 md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending || isFetching}
            className="bg-brand-600 text-white px-8 py-2.5 rounded-lg hover:bg-brand-700 transition-all font-semibold shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {isEdit ? "Updating..." : "Saving..."}
              </>
            ) : (
              isEdit ? "Update Product" : "Save Product"
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="bg-slate-100 text-slate-600 px-8 py-2.5 rounded-lg hover:bg-slate-200 transition-colors font-semibold shadow-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateProduct;