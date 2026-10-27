"use client";
import Link from "next/link";
import { ShoppingCart, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useSetCartMutation } from "@/lib/api";
import { errorMessage, money, type Product } from "@/lib/types";
import { useState } from "react";
export const productEmoji = (name:string) => {
  const n=name.toLowerCase();
  if(/headphone|audio|speaker/.test(n))return "🎧";
  if(/chair|furniture|desk/.test(n))return "🪑";
  if(/coffee|tea|cup/.test(n))return "☕";
  if(/lamp|light/.test(n))return "💡";
  if(/watch|clock/.test(n))return "⌚";
  if(/book|notebook/.test(n))return "📓";
  if(/shoe|sneaker/.test(n))return "👟";
  if(/plant|garden/.test(n))return "🪴";
  if(/bag|backpack/.test(n))return "🎒";
  if(/phone|mobile/.test(n))return "📱";
  return "📦";
};
export function ProductCard({product}:{product:Product}) {
  const [add,{isLoading}]=useSetCartMutation();
  const {token,user}=useSelector((s:RootState)=>s.auth);
  const router=useRouter();
  const [message,setMessage]=useState("");
  const available=product.isActive&&product.stockQuantity>0;
  async function addToCart(){
    if(!token){router.push("/login?next=/shop");return;}
    if(user?.role!=="customer"){setMessage("Only customers can place orders.");return;}
    try{await add({productId:product.id,quantity:1}).unwrap();setMessage("Added to cart!");}catch(e){setMessage(errorMessage(e));}
  }
  return <article className="product-card">
    <Link href={"/product/"+product.id} className="product-image" aria-label={"View "+product.name}>
      <span aria-hidden>{productEmoji(product.name)}</span>
      <span className={"pill "+(!available?"pill-neutral":"")}>{available?"In stock":"Unavailable"}</span>
    </Link>
    <div className="product-body"><div className="eyebrow">Everyday essentials</div>
      <Link href={"/product/"+product.id}><h3>{product.name} <ArrowUpRight size={13} style={{display:"inline"}}/></h3></Link>
      <p>{product.description?.slice(0,85)||"Thoughtfully selected for your everyday life."}</p>
      <div className="product-bottom"><strong>{money(product.price)}</strong><button className="btn btn-small" disabled={!available||isLoading} onClick={addToCart}><ShoppingCart size={14}/> {isLoading?"Adding":"Add"}</button></div>
      {message?<div className={message==="Added to cart!"?"small muted":"small"} role="status">{message}</div>:null}
    </div>
  </article>;
}
