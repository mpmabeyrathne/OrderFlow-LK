"use client";
import { useEffect, useRef } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { makeStore, type AppStore, type RootState, hydrate, setUser, signedOut } from "@/lib/store";
import { useMeQuery } from "@/lib/api";

function SessionBootstrap() {
  const dispatch = useDispatch();
  const { token, hydrated } = useSelector((s: RootState) => s.auth);
  useEffect(() => { dispatch(hydrate()); }, [dispatch]);
  const { data, isError } = useMeQuery(undefined, { skip: !hydrated || !token });
  useEffect(() => { if (data?.data) dispatch(setUser(data.data)); }, [data, dispatch]);
  useEffect(() => { if (isError && token) dispatch(signedOut()); }, [isError, token, dispatch]);
  return null;
}
export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();
  return <Provider store={storeRef.current}><SessionBootstrap />{children}</Provider>;
}
