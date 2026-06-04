// Shared types and constants across the dashboard

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface AuditEvent {
  id: string;
  type: string;       // matches Go json:"type"
  source: string;     // matches Go json:"source"
  payload: string;    // matches Go json:"payload" — raw JSON string
  timestamp: string;  // matches Go json:"timestamp"
}

export interface Metrics {
  total_orders: number;
  total_payments_processed: number;
  total_payments_success: number;
  total_payments_failed: number;
  total_notifications_sent: number;
  system_health: number;
}

export const PRODUCTS: Product[] = [
  {
    id: "prod_laptop",
    name: "High-End Laptop",
    price: 999.0,
    description: "Supercharged developer machine with plenty of RAM.",
  },
  {
    id: "prod_phone",
    name: "Flagship Phone",
    price: 499.0,
    description: "Elegant design, stunning display, and long battery life.",
  },
  {
    id: "prod_headphones",
    name: "ANC Headphones",
    price: 149.0,
    description: "High-fidelity audio with active noise cancelling.",
  },
];

export const EMPTY_METRICS: Metrics = {
  total_orders: 0,
  total_payments_processed: 0,
  total_payments_success: 0,
  total_payments_failed: 0,
  total_notifications_sent: 0,
  system_health: 0,
};
