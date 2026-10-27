import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import type { ApiEnvelope, AuthResult, AuthUser, CartItem, Order, PageResult, Payment, Product } from "./types";

export type CatalogFilter = { page?: number; limit?: number; search?: string; isActive?: string; sortBy?: string; sortOrder?: string; minPrice?: string; maxPrice?: string };
const params = (filters: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  return query.toString();
};
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/backend",
    prepareHeaders(headers, { getState }) {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("authorization", "Bearer " + token);
      return headers;
    },
  }),
  tagTypes: ["Products", "Cart", "Orders", "Payment"],
  endpoints: builder => ({
    products: builder.query<PageResult<Product>, CatalogFilter | void>({
      query: f => "/products?" + params({ page: f?.page, limit: f?.limit, search: f?.search, isActive: f?.isActive, sortBy: f?.sortBy, sortOrder: f?.sortOrder, minPrice: f?.minPrice, maxPrice: f?.maxPrice }),
      providesTags: ["Products"],
    }),
    product: builder.query<ApiEnvelope<Product>, string>({ query: id => "/products/" + id, providesTags: ["Products"] }),
    login: builder.mutation<ApiEnvelope<AuthResult>, {email:string;password:string}>({ query: body => ({ url:"/auth/login", method:"POST", body }) }),
    register: builder.mutation<ApiEnvelope<AuthResult>, {name:string;email:string;password:string}>({ query: body => ({ url:"/auth/register", method:"POST", body }) }),
    me: builder.query<ApiEnvelope<AuthUser>, void>({ query: () => "/auth/me" }),
    cart: builder.query<ApiEnvelope<CartItem[]>, void>({ query: () => "/cart", providesTags: ["Cart"] }),
    setCart: builder.mutation<ApiEnvelope<unknown>, {productId:string;quantity:number}>({
      query: ({productId,quantity}) => ({url:"/cart/items/"+productId, method:"PUT", body:{quantity}}),
      invalidatesTags:["Cart","Products"],
    }),
    removeCart: builder.mutation<ApiEnvelope<unknown>, string>({ query: id => ({url:"/cart/items/"+id,method:"DELETE"}),invalidatesTags:["Cart"] }),
    checkout: builder.mutation<ApiEnvelope<Order>, void>({ query:()=>({url:"/cart/checkout",method:"POST",body:{}}),invalidatesTags:["Cart","Orders","Products"] }),
    orders: builder.query<PageResult<Order>, {page?:number;status?:string} | void>({
      query: f => "/orders?" + params({page:f?.page,limit:10,status:f?.status}),providesTags:["Orders"],
    }),
    order: builder.query<{data:Order},string>({query:id=>"/orders/"+id,providesTags:["Orders"]}),
    payment: builder.query<ApiEnvelope<Payment>,string>({query:id=>"/payments/orders/"+id,providesTags:["Payment"]}),
    simulatePayment: builder.mutation<ApiEnvelope<Payment>, {orderId:string;outcome:"success"|"failure"}>({
      query: ({orderId,outcome})=>({url:"/payments/orders/"+orderId+"/simulate",method:"POST",body:{outcome}}),
      invalidatesTags:["Payment"],
    }),
  }),
});
export const {
  useProductsQuery, useProductQuery, useLoginMutation, useRegisterMutation, useMeQuery,
  useCartQuery, useSetCartMutation, useRemoveCartMutation, useCheckoutMutation,
  useOrdersQuery, useOrderQuery, usePaymentQuery, useSimulatePaymentMutation,
}=api;
