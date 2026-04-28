import api from "./api";
import type { PurchaseOrder } from "../types/inventory";

export const purchaseService = {
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    const response = await api.get("/purchase-orders");
    return response.data.data || response.data;
  },

  getPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data.data || response.data;
  },

  createPurchaseOrder: async (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const response = await api.post("/purchase-orders", data);
    return response.data.data || response.data;
  },

  updatePurchaseOrder: async (id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const response = await api.put(`/purchase-orders/${id}`, data);
    return response.data.data || response.data;
  },

  deletePurchaseOrder: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/purchase-orders/${id}`);
    return response.data.data || response.data;
  },

  updateStatus: async (id: string, status: PurchaseOrder["status"]): Promise<PurchaseOrder> => {
    const response = await api.patch(`/purchase-orders/${id}/status`, { status });
    return response.data.data || response.data;
  }
};
