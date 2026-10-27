"use client";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useOrdersQuery } from "@/lib/api";
import { money } from "@/lib/types";
import { ClipboardList, ArrowUpRight } from "lucide-react";
import { useState } from "react";

export default function OrdersPage(){
 const {token,hydrated,user}=useSelector((s:RootState)=>s.auth);
 const [status,setStatus]=useState(""),[page,setPage]=useState(1);
 const {data,isLoading,isError}=useOrdersQuery({page,status},{skip:!hydrated||!token});
 if(!hydrated)return <div className="spinner"/>;
 if(!token)return <div className="shell"><div className="empty" style={{marginTop:55}}><ClipboardList size={35}/><h3>Sign in to see your orders</h3><Link className="btn" href="/login?next=/orders">Sign in</Link></div></div>;
 return <div className="shell"><div className="page-heading"><div className="eyebrow">ORDER HISTORY</div><h1>{user?.role==="customer"?"Your orders":"All orders"}</h1><p>Track your demo order history and payment details.</p></div>
 <div className="filters"><label className="small" htmlFor="order-status">Filter by status</label><select className="select" id="order-status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">All statuses</option>{["pending","confirmed","processing","shipped","delivered","cancelled"].map(s=><option value={s} key={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}</select></div>
 {isLoading?<div className="spinner"/>:isError?<div className="message">Unable to load orders.</div>:!data?.data.length?<div className="empty"><ClipboardList size={37}/><h3>No orders yet</h3><p className="muted">Your purchases will appear here.</p><Link href="/shop" className="btn">Explore products</Link></div>:<div className="panel">{data.data.map(order=><Link href={"/orders/"+order.id} key={order.id} className="order-row"><div><span className="eyebrow">ORDER #{order.id.slice(0,8).toUpperCase()}</span><strong>{new Date(order.createdAt).toLocaleDateString()}</strong><span className="pill" style={{marginTop:8}}>{order.status}</span></div><div style={{textAlign:"right"}}><strong>{money(order.totalAmount,order.currency)}</strong><span className="small text-link">View details <ArrowUpRight size={13}/></span></div></Link>)}</div>}
 {data&&data.pagination.totalPages>1?<div className="pager"><button className="btn btn-secondary btn-small" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><span className="small">Page {page} of {data.pagination.totalPages}</span><button className="btn btn-secondary btn-small" disabled={page>=data.pagination.totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>:null}
 </div>;
}
