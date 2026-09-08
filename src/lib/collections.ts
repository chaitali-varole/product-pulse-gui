import type { Timestamp } from "firebase/firestore";

export const COLLECTIONS = {
  products: "products",
  suppliers: "suppliers",
  customers: "customers",
  purchases: "purchases",
  sales: "sales",
  stockTransactions: "stock_transactions",
} as const;

export type FireDate = Timestamp | null;

export interface Product {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierId: string;
  createdAt: FireDate;
}

export interface Supplier {
  id: string;
  supplierId: string;
  supplierName: string;
  mobile: string;
  email: string;
  address: string;
  createdAt: FireDate;
}

export interface Customer {
  id: string;
  customerId: string;
  customerName: string;
  mobile: string;
  email: string;
  address: string;
  createdAt: FireDate;
}

export interface Purchase {
  id: string;
  purchaseId: string;
  supplierId: string;
  productId: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  createdAt: FireDate;
}

export interface Sale {
  id: string;
  saleId: string;
  customerId: string;
  productId: string;
  quantity: number;
  sellingPrice: number;
  saleDate: string;
  createdAt: FireDate;
}

export interface StockTransaction {
  id: string;
  transactionId: string;
  productId: string;
  type: "IN" | "OUT";
  quantity: number;
  referenceId: string;
  date: string;
  createdAt: FireDate;
}

export function formatDate(value: FireDate | string | undefined): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  try {
    return value.toDate().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function formatDateTime(value: FireDate | undefined): string {
  if (!value) return "—";
  try {
    return value.toDate().toLocaleString();
  } catch {
    return "—";
  }
}

export function formatMoney(value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Human-friendly sequential business id, e.g. PRD-0007. */
export function nextBusinessId(prefix: string, existing: number): string {
  return `${prefix}-${String(existing + 1).padStart(4, "0")}`;
}
