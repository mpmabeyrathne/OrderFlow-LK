"use client";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, RefreshCcw, ArrowUpRight } from "lucide-react";
import { useProductsQuery } from "@/lib/api";
import { ProductCard } from "@/components/product-card";

export default function Home() {
 const {data,isLoading,isError}=useProductsQuery({page:1,limit:8,isActive:"true",sortBy:"createdAt",sortOrder:"desc"});
 return <div className="shell">
  <section className="hero"><div className="hero-copy"><div className="eyebrow">WELCOME TO ORDERFLOW · EST. 2026</div><h1>Good things. <span style={{color:"#6f9b56"}}>Better everyday.</span></h1><p>Discover a curated collection of everyday essentials — effortless to browse, simple to love.</p><div className="hero-actions"><Link href="/shop" className="btn">Explore collection <ArrowRight size={17}/></Link><Link href="/about" className="text-link small">Our story <ArrowUpRight size={13}/></Link></div></div><div className="hero-art"><div className="hero-box" aria-hidden="true">🛍️</div><div className="hero-tag">✦ Easy picks, happy days</div></div></section>
  <div className="stats"><div className="stat"><Truck size={29}/><div><strong>Simple shopping</strong><span>Easy ordering experience</span></div></div><div className="stat"><ShieldCheck size={29}/><div><strong>Secure by design</strong><span>Role-based access control</span></div></div><div className="stat"><RefreshCcw size={29}/><div><strong>Explore with confidence</strong><span>Portfolio demo storefront</span></div></div></div>
  <section><div className="section-head"><div><div className="eyebrow">THE LATEST PICKS</div><h2>Fresh finds, just for you.</h2></div><Link href="/shop" className="text-link">Browse all <ArrowRight size={15} style={{verticalAlign:"middle"}}/></Link></div>
  {isLoading?<div className="spinner" aria-label="Loading products"/>:isError?<div className="message">Could not load products. Start the API at localhost:3000 and refresh.</div>:data?.data.length?<div className="product-grid">{data.data.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="empty"><h3>Collection coming soon</h3><p className="muted">Add products through the API to populate the storefront.</p></div>}
  </section>
  <section style={{marginTop:65,background:"#e4edda",borderRadius:20,padding:"40px 32px",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:20}}><div><div className="eyebrow">BUILT TO DEMONSTRATE</div><h2 style={{fontSize:29,marginTop:8}}>A complete shopping workflow.</h2><p className="muted" style={{margin:"8px 0 0"}}>Discover, add to cart, place an order, and try a simulated payment.</p></div><Link href="/shop" className="btn">Start shopping <ArrowRight size={17}/></Link></section>
 </div>;
}
