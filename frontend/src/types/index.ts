export type InvoiceStatus = "NONE" | "REGISTERED" | "NEGOTIATED" | "PAID" | "CANCELLED";

export interface Invoice {
  id: string;
  invoiceHash: string;
  provider: string;
  providerName: string;
  payer: string;
  category: string;
  originalAmount: string;
  negotiatedAmount?: string;
  dueDate: number;
  registeredAt: number;
  paidAt?: number;
  status: InvoiceStatus;
}

export interface Receipt {
  id: string;
  invoiceId: string;
  payer: string;
  provider: string;
  providerName: string;
  category: string;
  originalAmount: string;
  paidAmount: string;
  savedAmount: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

export interface NegotiationStep {
  id: number;
  label: string;
  detail: string;
  status: "pending" | "running" | "done" | "error";
}

export interface ParsedInvoice {
  providerName: string;
  originalAmount: number;
  dueDate: string;
  accountId: string;
  category: string;
  confidence: number;
}
