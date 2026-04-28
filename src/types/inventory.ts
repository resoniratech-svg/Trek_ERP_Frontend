export type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStock: number;
  description?: string;
  status?: ProductStatus;
  unit?: string;
  division?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MovementType = "IN" | "OUT" | "ADJUSTMENT";

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  date: string;
  reference?: string;
  notes?: string;
  performedBy?: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  status: "Pending" | "Ordered" | "Received" | "Cancelled";
  totalAmount: number;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  notes?: string;
}

export interface SalesOrder {
  id: string;
  client: string;
  date: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  totalAmount: number;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export interface ProfitStats {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  profitMargin: number;
}
