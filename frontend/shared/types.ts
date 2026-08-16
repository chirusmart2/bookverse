export interface User {
  id: string;
  email: string;
  role: "seller" | "buyer";
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface Book {
  id: string;
  seller_id: string;
  title: string;
  author: string;
  isbn?: string | null;
  description?: string | null;
  price: string;
  stock: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  seller_name?: string;
}

export interface CartLine {
  id: string;
  book_id: string;
  book: Book;
  quantity: number;
  unit_price: string;
  line_total: string;
  available: boolean;
}

export interface Cart {
  items: CartLine[];
  subtotal: string;
  subtotals_by_seller: Record<string, string>;
  item_count: number;
}

export interface OrderItem {
  id: string;
  book_id: string;
  quantity: number;
  unit_price: string;
  title: string;
  author: string;
  line_total: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Courier {
  id: string;
  name: string;
  phone?: string;
  is_active: boolean;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  payment_method: string;
  payment_status: string;
  courier_partner_id?: string | null;
  shipping: ShippingAddress;
  subtotal: string;
  items: OrderItem[];
  courier?: Courier;
  seller_rating?: SellerRating;
  courier_rating?: CourierRating;
  created_at: string;
  updated_at: string;
}

export interface SellerRating {
  id: string;
  order_id: string;
  seller_id: string;
  buyer_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  buyer?: {
    first_name: string;
    last_name: string;
  };
}

export interface CourierRating {
  id: string;
  order_id: string;
  courier_partner_id: string;
  buyer_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  buyer?: {
    first_name: string;
    last_name: string;
  };
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}
