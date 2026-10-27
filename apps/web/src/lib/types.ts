export type Product = {
  id: string; name: string; description: string | null; price: string;
  stockQuantity: number; isActive: boolean; createdAt: string;
};
export type CartItem = { productId: string; quantity: number; name: string; price: string; stockQuantity: number; isActive: boolean };
export type Order = { id: string; customerId: string; totalAmount: string; currency: string; status: string; createdAt: string };
export type Payment = { id: string; orderId: string; amount: string; currency: string; status: "succeeded" | "failed"; createdAt: string };
export type AuthUser = { userId: string; customerId: string | null; role: "customer" | "admin" | "manager" };
export type PageResult<T> = { data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
export type ApiEnvelope<T> = { success: boolean; data: T; message?: string; replayed?: boolean };
export type AuthResult = { user: { id: string; customerId: string; role: AuthUser["role"]; email: string }; accessToken: string };
export type ApiError = { status?: number; data?: { message?: string; errors?: {field:string;message:string}[] } };
export function errorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as ApiError).data;
    return data?.errors?.map(e=>e.message).join("; ") || data?.message || "The request failed.";
  }
  return "Could not reach the API. Make sure the backend is running on port 3000.";
}
export function money(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value));
}
