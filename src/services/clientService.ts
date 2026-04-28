import apiClient from "./api";

import type { DivisionId } from "../constants/divisions";

export interface License {
  type: string;
  number: string;
  expiryDate: string;
  file?: File | null;
  documentUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  division: string;
  sector?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  clientCode?: string;
  contractType?: string;
  startDate?: string;
  renewalDate?: string;
  qid?: string;
  qidDocUrl?: string;
  crNumber?: string;
  crDocUrl?: string;
  computerCard?: string;
  computerCardDocUrl?: string;
  contractDocUrl?: string;
  licenses?: any[];
  agreements?: any[];
  creditLimit?: string;
}


export const clientService = {
  getClients: async (filters?: { sector?: string; division?: string }): Promise<Client[]> => {
    const cleanFilters: any = {};
    if (filters?.division) cleanFilters.division = filters.division.toUpperCase();
    if (filters?.sector) cleanFilters.sector = filters.sector.toUpperCase();

    const response = await apiClient.get("/clients", { params: cleanFilters });
    console.log("[DEBUG] getClients response:", response.data);
    const data = response.data?.data || response.data || [];
    return data.map((client: any) => ({
      id: String(client.id),
      userId: client.user_id,
      name: client.name || client.companyName || "N/A",
      companyName: client.name || client.companyName || "N/A",
      division: client.division,
      sector: client.sector || client.division,
      email: client.email || "N/A",
      phone: client.phone || "N/A",
      address: client.address,
      contactPerson: client.contact_person || client.contactPerson || "N/A",
    }));
  },

  createClient: async (clientData: any) => {
    const response = await apiClient.post("/clients", clientData);
    return response.data;
  },

  getClient: async (id: string): Promise<Client> => {
    const response = await apiClient.get(`/clients/${id}`);
    console.log("[DEBUG] getClient response:", response.data);
    const client = response.data?.data || response.data;
    return {
      id: String(client.id),
      name: client.contact_person || client.contactPerson || client.name || client.companyName || "",
      companyName: client.companyName || client.name || "",
      clientCode: client.client_code || client.clientCode,
      division: client.division,
      sector: client.sector || client.division,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address,
      contactPerson: client.contact_person || client.contactPerson || "",
      creditLimit: client.credit_limit || client.creditLimit,

      // Business documents
      qid: client.qid,
      qidDocUrl: client.qid_doc_url || client.qidDocUrl,
      crNumber: client.cr_number || client.crNumber,
      crDocUrl: client.cr_doc_url || client.crDocUrl,
      computerCard: client.computer_card || client.computerCard,
      computerCardDocUrl: client.computer_card_doc_url || client.computer_cardDocUrl,
      contractDocUrl: client.contract_doc_url || client.contractDocUrl,

      // Contract details
      contractType: client.contract_type || client.contractType,
      startDate: client.start_date || client.startDate,
      renewalDate: client.renewal_date || client.renewalDate,

      // Licenses & agreements
      licenses: client.licenses || [],
      agreements: client.agreements || [],
    };
  },

  updateClient: async (id: string, clientData: any): Promise<Client> => {
    const response = await apiClient.put(`/clients/${id}`, clientData);
    return response.data;
  },

  deleteClient: async (id: string) => {
    const response = await apiClient.delete(`/clients/${id}`);
    return response.data;
  },
};
