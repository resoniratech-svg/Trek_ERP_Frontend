import api from "./api";
import type { Lead, MarketingStats } from "../types/marketing";

export const leadService = {
  getLeads: async (divisionId?: string): Promise<Lead[]> => {
    const url = divisionId && divisionId !== 'all' ? `/leads?division=${divisionId}` : "/leads";
    const { data } = await api.get(url);
    return data.data || data;
  },

  getLead: async (id: string): Promise<Lead> => {
    const { data } = await api.get(`/leads/${id}`);
    return data.data || data;
  },

  createLead: async (data: Partial<Lead>): Promise<Lead> => {
    const { data: resData } = await api.post("/leads", data);
    return resData.data || resData;
  },

  updateLead: async (id: string, data: Partial<Lead>): Promise<Lead> => {
    const { data: resData } = await api.patch(`/leads/${id}`, data);
    return resData.data || resData;
  },

  deleteLead: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/leads/${id}`);
    return data.data || data;
  },

  updateLeadStatus: async (id: string, status: Lead["status"]): Promise<Lead> => {
    const { data: resData } = await api.patch(`/leads/${id}/status`, { status });
    return resData.data || resData;
  },

  getDashboardStats: async (): Promise<MarketingStats> => {
    const { data } = await api.get("/marketing/dashboard-stats");
    return data.data || data;
  }
};
