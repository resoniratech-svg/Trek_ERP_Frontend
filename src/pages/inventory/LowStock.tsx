import { useState } from "react";
import { useInventory } from "../../hooks/useInventory";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { PackageSearch, RefreshCw, X, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "../../services/inventoryService";
import { useDivision } from "../../context/DivisionContext";

function LowStock() {
  const { products } = useInventory();
  const { activeDivision } = useDivision();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManagePOs = user?.role === "SUPER_ADMIN" || user?.role === "ACCOUNTS";

  const [reorderModal, setReorderModal] = useState<{ open: boolean; product: any | null }>({ open: false, product: null });
  const [reorderQty, setReorderQty] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const reorderMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      inventoryService.reorderProduct(id, quantity),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      setReorderModal({ open: false, product: null });
      setReorderQty("");
      setSuccessMsg(`Successfully reordered ${variables.quantity} units!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (err: any) => {
      alert(`Reorder failed: ${err?.response?.data?.message || err.message}`);
    }
  });

  const handleReorder = () => {
    const qty = parseInt(reorderQty);
    if (!qty || qty <= 0) {
      alert("Please enter a valid quantity greater than 0.");
      return;
    }
    reorderMutation.mutate({ id: String(reorderModal.product.id), quantity: qty });
  };

  const filteredProducts = products.filter(product => {
    if (activeDivision === "all") return true;
    return product.division?.toUpperCase() === activeDivision.toUpperCase();
  });

  const lowStockProducts = filteredProducts.filter((p) => p.stockQuantity <= p.minStock);

  const formattedData = lowStockProducts.map((product) => ({
    ...product,
    "Product": product.name,
    "Current Stock": <span className="text-rose-600 font-black">{product.stockQuantity}</span>,
    "Minimum Req": <span className="text-gray-500 font-bold">{product.minStock}</span>,
    "Status": (
      <span className={`px-2 py-1 rounded-full text-[10px] font-black border ${
        product.stockQuantity === 0
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-rose-50 border-rose-100 text-rose-600"
      }`}>
        {product.stockQuantity === 0 ? "OUT OF STOCK" : "CRITICAL"}
      </span>
    ),
    "Action": canManagePOs ? (
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setReorderModal({ open: true, product });
            setReorderQty(String(product.minStock * 2 || 10));
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm"
        >
          <RefreshCw size={13} />
          Reorder
        </button>
        <button
          onClick={() => navigate(`/inventory/create-purchase-order?productId=${product.id}`)}
          className="text-xs font-bold text-brand-600 hover:underline"
        >
          Create PO
        </button>
      </div>
    ) : null
  }));

  const columns = canManagePOs
    ? ["Product", "Current Stock", "Minimum Req", "Status", "Action"]
    : ["Product", "Current Stock", "Minimum Req", "Status"];

  return (
    <div className="p-6">
      <PageHeader showBack
        title="Low Stock Alerts"
        subtitle="Items currently below minimum inventory levels"
      />

      {/* Success Toast */}
      {successMsg && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mt-6">
        {lowStockProducts.length > 0 ? (
          <DataTable columns={columns} data={formattedData} hideSearch={true} />
        ) : (
          <div className="p-20 text-center text-gray-400">
            <PackageSearch size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-bold">Inventory is healthy</p>
            <p className="text-sm">No items are currently below minimum stock levels.</p>
          </div>
        )}
      </div>

      {/* Reorder Modal */}
      {reorderModal.open && reorderModal.product && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
                    <RefreshCw size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Reorder Stock</h3>
                    <p className="text-xs text-slate-500 font-medium">Restock inventory for this product</p>
                  </div>
                </div>
                <button
                  onClick={() => { setReorderModal({ open: false, product: null }); setReorderQty(""); }}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Product Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Product</span>
                  <span className="font-bold text-slate-800">{reorderModal.product.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Current Stock</span>
                  <span className="font-black text-rose-600">{reorderModal.product.stockQuantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Minimum Required</span>
                  <span className="font-bold text-slate-700">{reorderModal.product.minStock}</span>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Reorder Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={reorderQty}
                  onChange={(e) => setReorderQty(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-center focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Enter quantity..."
                  autoFocus
                />
                <p className="mt-2 text-xs text-slate-400">
                  New stock will be: <span className="font-bold text-emerald-600">
                    {reorderModal.product.stockQuantity + (parseInt(reorderQty) || 0)}
                  </span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center gap-3 justify-end bg-slate-50/50">
              <button
                onClick={() => { setReorderModal({ open: false, product: null }); setReorderQty(""); }}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReorder}
                disabled={reorderMutation.isPending || !reorderQty || parseInt(reorderQty) <= 0}
                className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {reorderMutation.isPending ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Confirm Reorder
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LowStock;