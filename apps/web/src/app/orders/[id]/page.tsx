"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useOrderQuery, usePaymentQuery, useSimulatePaymentMutation } from "@/lib/api";
import type { RootState } from "@/lib/store";
import { money,errorMessage } from "@/lib/types";
import { ChevronLeft, CheckCircle2, CreditCard, AlertCircle } from "lucide-react";

export default function OrderDetail({params}:{params:Promise<{id:string}>}){
 const {id}=use(params);
 const {token,hydrated,user}=useSelector((s:RootState)=>s.auth);
 const {data,isLoading,isError}=useOrderQuery(id,{skip:!hydrated||!token});
 const {data:payment,isLoading:paymentLoading}=usePaymentQuery(id,{skip:!hydrated||!token||!data||user?.role!=="customer"});
 const [simulate,{isLoading:paying}]=useSimulatePaymentMutation(),[message,setMessage]=useState("");
 async function pay(outcome:"success"|"failure"){setMessage("");try{await simulate({orderId:id,outcome}).unwrap();setMessage("Demo payment recorded successfully.");}catch(e){setMessage(errorMessage(e));}}
 if(!hydrated)return <div className="spinner"/>;
 if(!token)return <div className="shell page-heading"><h1>Sign in to view orders</h1><Link className="btn" href="/login?next=/orders">Sign in</Link></div>;
 if(isLoading)return <div className="spinner"/>;
 if(isError||!data?.data)return <div className="shell page-heading"><h1>Order not found</h1><Link className="text-link" href="/orders">Back to orders</Link></div>;
 const order=data.data,p=payment?.data;
 return <div className="shell"><div style={{marginTop:26}}><Link href="/orders" className="text-link small"><ChevronLeft size={14} style={{verticalAlign:"middle"}}/> Back to orders</Link></div><div className="page-heading"><div className="eyebrow">YOUR ORDER DETAILS</div><h1>Order #{order.id.slice(0,8).toUpperCase()}</h1><p>Placed on {new Date(order.createdAt).toLocaleString()}</p></div>
 <div className="two-col"><div className="panel"><h2 style={{fontSize:22}}>Order overview</h2><div className="summary-row"><span className="muted">Status</span><span className="pill">{order.status}</span></div><div className="summary-row"><span className="muted">Order ID</span><code className="small" style={{overflowWrap:"anywhere",maxWidth:"70%",textAlign:"right"}}>{order.id}</code></div><div className="summary-row"><span className="muted">Currency</span><strong>{order.currency}</strong></div><div className="summary-row summary-total"><span>Total</span><strong>{money(order.totalAmount,order.currency)}</strong></div><p className="small muted">This portfolio checkout demonstrates backend order creation and inventory updates. It is not a commercial purchase.</p></div>
 <aside className="panel"><div style={{display:"flex",alignItems:"center",gap:10}}><CreditCard size={22} color="#174d3c"/><h2 style={{fontSize:22}}>Simulated payment</h2></div>
 {user?.role!=="customer"?<p className="muted">Only the customer who owns an order can simulate its payment.</p>:paymentLoading?<p className="small muted">Loading payment status...</p>:p?<div style={{marginTop:21}}>{p.status==="succeeded"?<CheckCircle2 size={35} color="#32834a"/>:<AlertCircle size={35} color="#b57639"/>}<h3 style={{marginTop:9}}>Payment {p.status}</h3><p className="muted small">Recorded {new Date(p.createdAt).toLocaleString()}</p><strong>{money(p.amount,p.currency)}</strong><div className="message success">This is a simulation. No real money was processed.</div></div>:order.status==="cancelled"?<div className="message">Cancelled orders cannot receive a simulated payment.</div>:<><p className="muted small" style={{marginTop:16}}>Choose an outcome to demonstrate how the API records a payment. One immutable outcome per order.</p><button className="btn btn-block" disabled={paying} onClick={()=>pay("success")}>Simulate successful payment</button><button style={{marginTop:10}} className="btn btn-secondary btn-block" disabled={paying} onClick={()=>pay("failure")}>Simulate failed payment</button></>}
 {message?<div className={message.startsWith("Demo")?"message success":"message"} role="status">{message}</div>:null}
 </aside></div></div>;
}
