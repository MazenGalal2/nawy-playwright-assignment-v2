export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface RegisteredUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  address: Address;
}

export interface Address {
  street: string | null;
  house_number: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
}

export interface ProductSearchResponse {
  current_page: number;
  data: Product[];
  total: number;
}

export interface Cart {
  id: string;
}

export interface InvoicePayload {
  payment_method: "cash-on-delivery" | "credit-card" | "bank-transfer" | "buy-now-pay-later" | "gift-card";
  payment_details: Record<string, unknown>;
  billing_street: string;
  billing_city: string;
  billing_country: string;
  billing_state?: string;
  billing_postal_code?: string;
  cart_id: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  user_id: string;
  billing_street: string;
  billing_city: string;
  billing_country: string;
  subtotal: number;
  total: number;
  eco_discount_percentage: number | null;
  eco_discount_amount: number;
  additional_discount_percentage: number | null;
  additional_discount_amount: number;
  created_at: string;
}
