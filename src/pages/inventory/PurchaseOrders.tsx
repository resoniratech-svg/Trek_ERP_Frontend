import { useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { Plus, Eye, Trash2, ShoppingCart, Loader2, X } from "lucide-react";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { purchaseService } from "../../services/purchaseService";
import api from "../../services/api";
import type { PurchaseOrder } from "../../types/inventory";
import { useAuth } from "../../context/AuthContext";

function PurchaseOrders() {
  const { user } = useAuth();
  const canManagePOs = user?.role === "SUPER_ADMIN" || user?.role === "ACCOUNTS";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: purchaseOrders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders"],
    queryFn: purchaseService.getPurchaseOrders
  });

  const handleDelete = async (id: any) => {
    if (!window.confirm("Are you sure you want to delete this purchase order?")) return;
    setDeletingId(String(id));
    try {
      await api.delete(`/purchase-orders/${id}`);
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    } catch (error: any) {
      alert(`Failed to delete: ${error?.response?.data?.message || error.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formattedData = purchaseOrders.map((order) => ({
    ...order,
    "Order ID": order.id,
    "Product": order.productName || "-",
    "Qty": order.quantity || 0,
    "Total": `QAR ${Number(order.totalAmount || 0).toLocaleString()}`,
    "Status": (
      <span className={`px-2 py-1 rounded-full text-[10px] font-black border ${
        order.status === 'Received' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
        order.status === 'Cancelled' ? 'bg-rose-50 border-rose-100 text-rose-600' :
        'bg-amber-50 border-amber-100 text-amber-600'
      }`}>
        {(order.status || 'Pending').toUpperCase()}
      </span>
    ),
    "Date": order.date ? dayjs(order.date).format("MMM DD, YYYY") : "-",
    "Actions": ""
  }));

  const columns = ["Order ID", "Product", "Qty", "Total", "Status", "Date", "Actions"];

  return (
    <div className="p-6">
      <PageHeader showBack
        title="Purchase Orders"
        subtitle="Manage supplier orders and incoming stock"
        action={
          canManagePOs ? (
            <button
              onClick={() => navigate("/inventory/create-purchase-order")}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition font-bold shadow-sm"
            >
              <Plus size={16} />
              New PO
            </button>
          ) : undefined
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mt-6">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 size={40} className="animate-spin text-brand-600" />
            <p className="text-sm font-medium">Loading purchase orders...</p>
          </div>
        ) : purchaseOrders.length > 0 ? (
          <DataTable
            columns={columns}
            data={formattedData}
            hideSearch={true}
            renderActions={(row: any) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const order = purchaseOrders.find((o: any) => o.id === row.id);
                    if (order) setViewOrder(order);
                  }}
                  className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors cursor-pointer"
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  disabled={deletingId === String(row.id)}
                  title="Delete Order"
                >
                  {deletingId === String(row.id) ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            )}
          />
        ) : (
          <div className="p-20 text-center text-gray-400">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-bold">No purchase orders found</p>
            <p className="text-sm">Create your first PO to start tracking stock.</p>
          </div>
        )}
      </div>

      {viewOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewOrder(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-xl font-black text-slate-900 mb-6">Purchase Order Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500 font-medium">Order ID</span><span className="font-bold">{viewOrder.id}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500 font-medium">Product</span><span className="font-bold">{viewOrder.productName}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500 font-medium">Quantity</span><span className="font-bold">{viewOrder.quantity}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500 font-medium">Unit Price</span><span className="font-bold">QAR {Number(viewOrder.unitPrice || 0).toLocaleString()}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500 font-medium">Total</span><span className="font-black text-brand-600">QAR {Number(viewOrder.totalAmount || 0).toLocaleString()}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500 font-medium">Status</span><span className="font-bold">{viewOrder.status}</span></div>
              <div className="flex justify-between"><span className="text-sm text-slate-500 font-medium">Date</span><span className="font-bold">{viewOrder.date ? dayjs(viewOrder.date).format("MMM DD, YYYY") : "-"}</span></div>
            </div>
            <button onClick={() => setViewOrder(null)} className="mt-8 w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold hover:bg-black transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseOrders;