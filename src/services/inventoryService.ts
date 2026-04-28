import api from "./api";
import type { InventoryProduct, InventoryMovement, SalesOrder, ProfitStats } from "../types/inventory";

export const inventoryService = {
  getProducts: async (): Promise<InventoryProduct[]> => {
    const { data } = await api.get("/products");
    return data.data || data;
  },

  getProduct: async (id: string): Promise<InventoryProduct> => {
    const { data } = await api.get(`/products/${id}`);
    return data.data || data;
  },

  createProduct: async (productData: Partial<InventoryProduct>): Promise<InventoryProduct> => {
    const { data } = await api.post("/products", productData);
    return data.data || data;
  },

  updateProduct: async (id: string, productData: Partial<InventoryProduct>): Promise<InventoryProduct> => {
    const { data } = await api.put(`/products/${id}`, productData);
    return data.data || data;
  },

  updateStock: async (id: string, quantity: number): Promise<{ success: boolean }> => {
    const { data } = await api.patch(`/products/${id}/stock`, { quantity });
    return data.data || data;
  },

  deleteProduct: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/inventory/products/${id}`);
    return data.data || data;
  },

  getMovements: async (): Promise<InventoryMovement[]> => {
    const { data } = await api.get("/inventory/movements");
    return data.data || data;
  },

  getSalesOrders: async (): Promise<SalesOrder[]> => {
    const { data } = await api.get("/inventory/sales-orders");
    return data.data || data;
  },

  getProfitStats: async (): Promise<ProfitStats> => {
    const { data } = await api.get("/inventory/profit-stats");
    return data.data || data;
  },

  createSalesOrder: async (data: Partial<SalesOrder>): Promise<SalesOrder> => {
    const { data: responseData } = await api.post("/inventory/sales-orders", data);
    return responseData.data || responseData;
  },

  createMovement: async (data: Partial<InventoryMovement>): Promise<InventoryMovement> => {
    const { data: responseData } = await api.post("/inventory/movements", data);
    return responseData.data || responseData;
  },

  deleteSalesOrder: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/inventory/sales-orders/${id}`);
    return data.data || data;
  },

  reorderProduct: async (id: string, quantity: number): Promise<InventoryProduct> => {
    const { data } = await api.patch(`/inventory/products/${id}/reorder`, { quantity });
    return data.data || data;
  }
};

export default inventoryService;
