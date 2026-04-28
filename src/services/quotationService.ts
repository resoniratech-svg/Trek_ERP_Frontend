import api from "./api";

export interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/** Quotation object representing the database schema */
export interface Quotation {
  id?: string;
  qtn_number: string;
  client_id: string | number;
  division: string;
  total_amount: number;
  status: string;
  items: QuotationItem[];
  project_name?: string;
  project?: string;
  client?: string;
  discount?: number;
  aboutUs?: string;
  whatWeDo?: string;
  proposalIntro?: string;
  financialTerms?: string;
  clientDuties?: string;
  paymentTerms?: string;
  valid_until?: string;
  terms?: string;
  client_name?: string;
  client_company?: string;
  created_at?: string;
}

export const quotationService = {
  getQuotations: async (): Promise<Quotation[]> => {
    const { data } = await api.get("/quotations");
    return data.data || [];
  },

  getQuotation: async (id: string): Promise<Quotation> => {
    const { data } = await api.get(`/quotations/${id}`);
    return data.data;
  },

  createQuotation: async (quotationData: Partial<Quotation>): Promise<Quotation> => {
    const response = await api.post("/quotations", quotationData);
    return response.data.data;
  },

  updateQuotation: async (id: string, quotationData: Partial<Quotation>): Promise<Quotation> => {
    const { data } = await api.put(`/quotations/${id}`, quotationData);
    return data.data;
  },

  getNextNumber: async (division: string): Promise<string> => {
    const { data } = await api.get(`/quotations/next-number/${division}`);
    return data.data.nextNumber;
  },

  deleteQuotation: async (id: string): Promise<void> => {
    await api.delete(`/quotations/${id}`);
  }
};
