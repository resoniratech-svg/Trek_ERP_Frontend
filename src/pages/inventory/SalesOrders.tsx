import { useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Trash2, Truck, Loader2, X } from "lucide-react";
import dayjs from "dayjs";
import { useState } from "react";
import { inventoryService } from "../../services/inventoryService";
import api from "../../services/api";
import type { SalesOrder } from "../../types/inventory";
import { useAuth } from "../../context/AuthContext";

import { useDivision } from "../../context/DivisionContext";

function SalesOrders() {
  const { user } = useAuth();
  const { activeDivision } = useDivision();
  const canManageSOs = user?.role === "SUPER_ADMIN" || user?.role === "PROJECT_MANAGER";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewOrder, setViewOrder] = useState<SalesOrder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: salesOrders = [], isLoading } = useQuery<SalesOrder[]>({
    queryKey: ["sales-orders", activeDivision],
    queryFn: () => inventoryService.getSalesOrders(activeDivision)
  });

  const handleDelete = async (id: any) => {
    if (!window.confirm("Are you sure you want to delete this sales order?")) return;
    setDeletingId(String(id));
    try {
      await api.delete(`/inventory/sales-orders/${id}`);
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    } catch (error: any) {
      alert(`Failed to delete: ${error?.response?.data?.message || error.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse text-gray-400">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="font-bold">Syncing Sales Registry...</p>
      </div>
    );
  }

  const formattedData = salesOrders.map((order: any) => ({
    ...order,
    "Order ID": order.orderNumber || order.id,
    "Product": order.productName || "-",
    "Qty": order.quantity || 0,
    "Total": `QAR ${Number(order.totalAmount || 0).toLocaleString()}`,
    "Status": (
      <span className={`px-2 py-1 rounded-full text-[10px] font-black border ${
        order.status === 'Delivered' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
        order.status === 'Cancelled' ? 'bg-rose-50 border-rose-100 text-rose-600' :
        'bg-blue-50 border-blue-100 text-blue-600'
      }`}>
        {(order.status || 'Processing').toUpperCase()}
      </span>
    ),
    "Date": order.date ? dayjs(order.date).format("MMM DD, YYYY") : "-",
    "Actions": ""
  }));

  const columns = ["Order ID", "Product", "Qty", "Total", "Status", "Date", "Actions"];

  return (
    <div className="p-6">
      <PageHeader showBack
        title="Sales Orders"
        subtitle="Track customer orders and shipments"
        action={
          canManageSOs ? (
            <button
              onClick={() => navigate("/inventory/create-sales-order")}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-bold shadow-sm"
            >
              <Plus size={16} />
              New SO
            </button>
          ) : undefined
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mt-6">
        {salesOrders.length > 0 ? (
          <DataTable
            columns={columns}
            data={formattedData}
            hideSearch={true}
            renderActions={(row: any) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const order = salesOrders.find((o: any) => o.id === row.id);
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
            <Truck size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-bold">No sales orders found</p>
            <p className="text-sm">New sales will appear here automatically.</p>
          </div>
        )}
      </div>

      {viewOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewOrder(null)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-xl font-black text-slate-900 mb-6">Sales Order Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500 font-medium">Order ID</span><span className="font-bold">{viewOrder.id}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500 font-medium">Product</span><span className="font-bold">{viewOrder.productName}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500 font-medium">Quantity</span><span className="font-bold">{viewOrder.quantity}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500 font-medium">Unit Price</span><span className="font-bold">QAR {Number(viewOrder.unitPrice || 0).toLocaleString()}</span></div>
              <div className="flex justify-between border-b pb-2"><span className="text-sm text-slate-500 font-medium">Total</span><span className="font-black text-emerald-600">QAR {Number(viewOrder.totalAmount || 0).toLocaleString()}</span></div>
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

export default SalesOrders;