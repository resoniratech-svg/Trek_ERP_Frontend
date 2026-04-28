import api from "./api";

export const boqService = {
  createBOQ: async (data: any) => {
    const response = await api.post("/boqs", data);
    return response.data;
  },

  getAllBOQs: async () => {
    const response = await api.get("/boqs");
    return response.data;
  },

  getBOQById: async (id: string | number) => {
    const response = await api.get(`/boqs/${id}`);
    return response.data;
  },

  updateStatus: async (id: string | number, status: string) => {
    console.log(`[BOQ_DEBUG] Sending PUT request to: /boqs/${id}/status`, { status });
    const response = await api.put(`/boqs/${id}/status`, { status });
    return response.data;
  },

  updateBOQ: async (id: string | number, data: any) => {
    const response = await api.put(`/boqs/${id}`, data);
    return response.data;
  },

  deleteBOQ: async (id: string | number) => {
    const response = await api.delete(`/boqs/${id}`);
    return response.data;
  },
};
