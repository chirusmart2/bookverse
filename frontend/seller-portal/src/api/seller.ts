import { apiFetch } from "@shared/apiClient";
import type { Book, Courier, Order, PaginationMeta, SellerRating } from "@shared/types";

export const sellerApi = {
  dashboard: () =>
    apiFetch<{ order_counts: Record<string, number> }>("/seller/dashboard"),

  listBooks: (params?: { page?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return apiFetch<{ books: Book[]; meta: PaginationMeta; counts: { active: number; inactive: number; total: number } }>(
      `/seller/books${qs ? `?${qs}` : ""}`
    );
  },

  createBook: (data: Record<string, unknown>) =>
    apiFetch<{ book: Book }>("/seller/books", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  bulkCreateBooks: (books: Record<string, unknown>[]) =>
    apiFetch<{ books: Book[]; count: number }>("/seller/books/bulk", {
      method: "POST",
      body: JSON.stringify({ books }),
    }),

  updateBook: (id: string, data: Record<string, unknown>) =>
    apiFetch<{ book: Book }>(`/seller/books/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteBook: (id: string) =>
    apiFetch<{ book: Book }>(`/seller/books/${id}`, { method: "DELETE" }),

  listOrders: (params?: { page?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return apiFetch<{ orders: Order[]; meta: PaginationMeta }>(
      `/seller/orders${qs ? `?${qs}` : ""}`
    );
  },

  getOrder: (id: string) => apiFetch<{ order: Order }>(`/seller/orders/${id}`),

  updateOrderStatus: (
    id: string,
    status: string,
    courier_partner_id?: string
  ) =>
    apiFetch<{ order: Order }>(`/seller/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, courier_partner_id }),
    }),

  listCouriers: () => apiFetch<{ couriers: Courier[] }>("/seller/couriers"),

  getReviews: () => apiFetch<{ reviews: SellerRating[] }>("/seller/reviews"),
};
