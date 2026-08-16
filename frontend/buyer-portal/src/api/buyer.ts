import { apiFetch } from "@shared/apiClient";
import type { Book, Cart, Courier, Order, PaginationMeta, SellerRating } from "@shared/types";

export const buyerApi = {
  listBooks: (params?: { page?: number; q?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.q) q.set("q", params.q);
    const qs = q.toString();
    return apiFetch<{ books: Book[]; meta: PaginationMeta }>(
      `/buyer/books${qs ? `?${qs}` : ""}`
    );
  },

  getBook: (id: string) => apiFetch<{ book: Book }>(`/buyer/books/${id}`),

  getCart: () => apiFetch<{ cart: Cart }>("/buyer/cart"),

  addToCart: (book_id: string, quantity: number) =>
    apiFetch<{ cart: Cart }>("/buyer/cart/items", {
      method: "POST",
      body: JSON.stringify({ book_id, quantity }),
    }),

  updateCartItem: (book_id: string, quantity: number) =>
    apiFetch<{ cart: Cart }>(`/buyer/cart/items/${book_id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),

  removeCartItem: (book_id: string) =>
    apiFetch<{ cart: Cart }>(`/buyer/cart/items/${book_id}`, { method: "DELETE" }),

  clearCart: () => apiFetch<{ cart: Cart }>("/buyer/cart", { method: "DELETE" }),

  checkout: (shipping: Record<string, string>) =>
    apiFetch<{ orders: Order[] }>("/buyer/checkout", {
      method: "POST",
      body: JSON.stringify({ shipping }),
    }),

  listOrders: (page?: number) => {
    const q = page ? `?page=${page}` : "";
    return apiFetch<{ orders: Order[]; meta: PaginationMeta }>(`/buyer/orders${q}`);
  },

  getOrder: (id: string) => apiFetch<{ order: Order }>(`/buyer/orders/${id}`),

  cancelOrder: (id: string) =>
    apiFetch<{ order: Order }>(`/buyer/orders/${id}/cancel`, { method: "POST" }),

  rateSeller: (orderId: string, rating: number, comment?: string) =>
    apiFetch<{ rating: unknown }>(`/buyer/orders/${orderId}/rate-seller`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),

  rateCourier: (orderId: string, rating: number, comment?: string) =>
    apiFetch<{ rating: unknown }>(`/buyer/orders/${orderId}/rate-courier`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),

  listCouriers: () => apiFetch<{ couriers: Courier[] }>("/buyer/couriers"),

  getSellerReviews: (sellerId: string) =>
    apiFetch<{ reviews: SellerRating[] }>(`/buyer/sellers/${sellerId}/reviews`),
};
