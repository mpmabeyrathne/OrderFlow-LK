"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useCartQuery, useSetCartMutation, useRemoveCartMutation, useCheckoutMutation } from "@/lib/api";
import type { RootState } from "@/lib/store";
import { errorMessage, money } from "@/lib/types";
import { productEmoji } from "@/components/product-card";
import { useState } from "react";

export default function CartPage(){
 const {token,user,hydrated}=useSelector((s:RootState)=>s.auth),router=useRouter();
 const {data,isLoading,isError}=useCartQuery(undefined,{skip:!hydrated||!token||user?.role!=="customer"});
 const [setCart,{isLoading:changing}]=useSetCartMutation(),[remove,{isLoading:removing}]=useRemoveCartMutation(),[checkout,{isLoading:checkingOut}]=useCheckoutMutation();
 const [message,setMessage]=useState("");
 const items=data?.data??[],total=items.reduce((sum,p)=>sum+Number(p.price)*p.quantity,0),count=items.reduce((sum,p)=>sum+p.quantity,0);
 async function change(id:string,quantity:number){setMessage("");try{if(quantity===0)await remove(id).unwrap();else await setCart({productId:id,quantity}).unwrap();}catch(e){setMessage(errorMessage(e));}}
 async function placeOrder(){setMessage("");try{const o=await checkout().unwrap();router.push("/orders/"+o.data.id);}catch(e){setMessage(errorMessage(e));}}
 if(!hydrated)return <div className="spinner"/>;
 if(!token)return <div className="shell"><div className="empty" style={{marginTop:50}}><ShoppingBag size={40}/><h3>Sign in to view your cart</h3><p className="muted">Your shopping cart is saved to your account.</p><Link href="/login?next=/cart" className="btn">Sign in</Link></div></div>;
 if(user?.role!=="customer")return <div className="shell"><div className="empty" style={{marginTop:50}}><h3>Customer checkout only</h3><Link href="/staff" className="btn">Open staff dashboard</Link></div></div>;
 return <div className="shell"><div className="page-heading"><div className="eyebrow">YOUR SELECTION</div><h1>Shopping cart</h1><p>{count} item{count===1?"":"s"} in your cart</p></div>
 {isLoading?<div className="spinner"/>:isError?<div className="message">Could not load your cart. Please try signing in again.</div>:!items.length?<div className="empty"><ShoppingBag size={38}/><h3>Your cart is looking a little empty.</h3><p className="muted">Find something you love in our collection.</p><Link className="btn" href="/shop">Browse products <ArrowRight size={16}/></Link></div>:
 <div className="two-col"><div className="panel">{items.map(item=><div className="cart-row" key={item.productId}>
 <div className="mini-image">{productEmoji(item.name)}</div><div><Link href={"/product/"+item.productId}><h3>{item.name}</h3></Link><span className="small muted">{money(item.price)} each</span>
 <div className="qty"><button disabled={changing||removing} aria-label={"Decrease "+item.name} onClick={()=>change(item.productId,item.quantity-1)}>−</button><strong>{item.quantity}</strong><button disabled={changing||removing||item.quantity>=Math.min(100,item.stockQuantity)} aria-label={"Increase "+item.name} onClick={()=>change(item.productId,item.quantity+1)}>+</button><button disabled={changing||removing} style={{marginLeft:12}} aria-label={"Remove "+item.name} onClick={()=>change(item.productId,0)}><Trash2 size={14}/></button></div></div>
 <div className="price-col"><strong>{money(Number(item.price)*item.quantity)}</strong>{!item.isActive||item.stockQuantity<item.quantity?<div className="message small">Stock changed</div>:null}</div>
 </div>)}<Link href="/shop" className="text-link small" style={{display:"inline-block",marginTop:24}}>← Continue shopping</Link></div>
 <aside className="panel"><h2 style={{fontSize:22}}>Order summary</h2><div className="summary-row"><span className="muted">Subtotal ({count} items)</span><strong>{money(total)}</strong></div><div className="summary-row"><span className="muted">Shipping</span><strong>Demo only</strong></div><div className="summary-row summary-total"><span>Total</span><span>{money(total)}</span></div><p className="small muted">Checkout creates a real order in the project database. Payment is simulated and no money is charged.</p>
 {message?<div className="message" role="alert">{message}</div>:null}
 <button className="btn btn-block" style={{marginTop:18}} disabled={checkingOut||changing||removing||items.some(i=>!i.isActive||i.stockQuantity<i.quantity)} onClick={placeOrder}>{checkingOut?"Processing...":"Place demo order"} <ArrowRight size={16}/></button></aside>
 </div>}
 </div>;
}
