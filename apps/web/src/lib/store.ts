import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "./api";
import type { AuthUser } from "./types";

type AuthState = { token: string | null; user: AuthUser | null; hydrated: boolean };
const initialState: AuthState = { token: null, user: null, hydrated: false };
const auth = createSlice({
  name: "auth", initialState,
  reducers: {
    hydrate(state) {
      if (typeof window !== "undefined") state.token = sessionStorage.getItem("orderflow_token");
      state.hydrated = true;
    },
    signedIn(state, action: PayloadAction<string>) {
      state.token = action.payload;
      state.user = null;
      state.hydrated = true;
      if (typeof window !== "undefined") sessionStorage.setItem("orderflow_token", action.payload);
    },
    setUser(state, action: PayloadAction<AuthUser>) { state.user = action.payload; },
    signedOut(state) {
      state.token = null; state.user = null; state.hydrated = true;
      if (typeof window !== "undefined") sessionStorage.removeItem("orderflow_token");
    },
  },
});
export const { hydrate, signedIn, signedOut, setUser } = auth.actions;
export const makeStore = () => configureStore({
  reducer: { auth: auth.reducer, [api.reducerPath]: api.reducer },
  middleware: getDefault => getDefault().concat(api.middleware),
});
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
