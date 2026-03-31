typescript
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  timeout: 90000,
  withCredentials: true,
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err?.response?.data?.error || err?.message || "Request failed";
    return Promise.reject(new Error(msg));
  }
);

export const invoiceApi = {
  upload: async (file: File) => {
    const form = new FormData();
    form.append("invoice", file);
    const { data } = await api.post("/api/invoice/parse", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  register: async (payload: {
    invoiceHash: string; payer: string; providerName: string;
    originalAmount: number; dueDate: number; category: string;
  }) => {
    const { data } = await api.post("/api/invoice/register", payload);
    return data;
  },
  getByWallet: async (address: string) => {
    const { data } = await api.get(`/api/invoice/${address}`);
    return data;
  },
};

export const negotiationApi = {
  streamUrl: (invoiceId: string, wallet?: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const qs   = wallet ? `?wallet=${wallet}` : "";
    return `${base}/api/negotiate/${invoiceId}/stream${qs}`;
  },
  execute: async (invoiceId: string, walletAddress: string) => {
    const { data } = await api.post(`/api/negotiate/${invoiceId}/execute`, { walletAddress });
    return data;
  },
};

export const receiptApi = {
  getByWallet: async (address: string) => {
    const { data } = await api.get(`/api/receipts/${address}`);
    return data;
  },
};

export const statsApi = {
  getByWallet: async (address: string) => {
    const { data } = await api.get(`/api/stats/${address}`);
    return data;
  },
};
