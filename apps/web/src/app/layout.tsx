import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header, Footer } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "OrderFlow — Everyday essentials, made easy",
  description: "Discover everyday essentials and experience the OrderFlow shopping demo.",
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><Providers><div className="announcement">A FULL-STACK E-COMMERCE PORTFOLIO PROJECT • SIMULATED PAYMENTS ONLY</div><Header/><main>{children}</main><Footer/></Providers></body></html>;
}
