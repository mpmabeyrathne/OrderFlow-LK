"use client";
import { use, useState } from "react";
import Link from "next/link";
import { ChevronRight, ShoppingCart, ShieldCheck, PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useProductQuery, useSetCartMutation } from "@/lib/api";
import { errorMessage, money } from "@/lib/types";
import { productEmoji } from "@/components/product-card";

export default function ProductDetail({params}:{params:Promise<{id:string}>}) {
 const {id}=use(params);
 const {data,isLoading,isError}=useProductQuery(id);
 const [quantity,setQuantity]=useState(1),[message,setMessage]=useState("");
 const [add,{isLoading:adding}]=useSetCartMutation();
 const {token,user}=useSelector((s:RootState)=>s.auth),router=useRouter();
 if(isLoading)return <div className="shell"><div className="spinner"/></div>;
 if(isError||!data?.data)return <div className="shell page-heading"><h1>Product not found</h1><Link className="text-link" href="/shop">Back to shop</Link></div>;
 const p=data.data;
 async function handleAdd(){
  if(!token){router.push("/login?next=/product/"+id);return;}
  if(user?.role!=="customer"){setMessage("Customer account required.");return;}
  try{await add({productId:id,quantity}).unwrap();router.push("/cart");}catch(e){setMessage(errorMessage(e));}
 }
 return <div className="shell"><div className="small muted" style={{marginTop:25}}><Link href="/shop" className="text-link">Shop</Link> <ChevronRight size={12} style={{verticalAlign:"middle"}}/> {p.name}</div>
 <div className="detail-grid"><div className="detail-art" aria-label={"Illustration for "+p.name}>{productEmoji(p.name)}</div>
 <section className="detail-copy"><div className="eyebrow">THE ORDERFLOW COLLECTION</div><h1>{p.name}</h1>
 <span className={"pill "+(!p.isActive||p.stockQuantity===0?"pill-neutral":"")}>{p.isActive&&p.stockQuantity>0?p.stockQuantity+" available":"Currently unavailable"}</span>
 <div className="price-lg">{money(p.price)}</div>
 <p>{p.description||"A thoughtful addition to your everyday routine. Selected for simplicity and practical value."}</p>
 <div className="qty"><span className="small muted">Quantity</span><button type="button" aria-label="Decrease quantity" onClick={()=>setQuantity(q=>Math.max(1,q-1))}>−</button><strong>{quantity}</strong><button type="button" aria-label="Increase quantity" onClick={()=>setQuantity(q=>Math.min(Math.min(100,p.stockQuantity),q+1))}>+</button></div>
 <button style={{marginTop:22,minWidth:220}} className="btn" disabled={!p.isActive||p.stockQuantity===0||adding} onClick={handleAdd}><ShoppingCart size={18}/>{adding?"Adding...":"Add to cart"}</button>
 {message?<div className="message" role="alert">{message}</div>:null}
 <div className="feature-strip"><span><ShieldCheck size={16} style={{verticalAlign:"middle"}}/> Secure API demo</span><span><PackageCheck size={16} style={{verticalAlign:"middle"}}/> Persistent cart</span></div>
 </section></div></div>;
}
