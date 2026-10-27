"use client";
import { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Package, Boxes, ClipboardList, ShieldAlert, PlusCircle, RefreshCcw } from "lucide-react";
import type { RootState } from "@/lib/store";
import { useProductsQuery, useOrdersQuery, useCreateProductMutation, useUpdateStockMutation, useUpdateProductMutation, useUpdateOrderStatusMutation } from "@/lib/api";
import { money, errorMessage, type Product } from "@/lib/types";

const statuses=["pending","confirmed","processing","shipped","delivered","cancelled"];
function ProductAdminRow({product}:{product:Product}){
 const [stock,setStock]=useState(String(product.stockQuantity));
 const [message,setMessage]=useState("");
 const [updateStock,{isLoading:savingStock}]=useUpdateStockMutation();
 const [updateProduct,{isLoading:updating}]=useUpdateProductMutation();
 async function adjustStock(){setMessage("");try{
   await updateStock({id:product.id,expectedStockQuantity:product.stockQuantity,stockQuantity:Number(stock)}).unwrap();
   setMessage("Stock updated.");
 }catch(e){setMessage(errorMessage(e));}}
 async function toggleActive(){setMessage("");try{
   await updateProduct({id:product.id,body:{isActive:!product.isActive}}).unwrap();
   setMessage("Product updated.");
 }catch(e){setMessage(errorMessage(e));}}
 return <div className="order-row"><div style={{flex:1,minWidth:170}}><strong>{product.name}</strong><span className="small muted">{money(product.price)} · <span className={"pill "+(!product.isActive?"pill-neutral":"")}>{product.isActive?"Active":"Inactive"}</span></span></div>
 <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><input aria-label={"Stock for "+product.name} type="number" min="0" step="1" className="input" style={{width:90}} value={stock} onChange={e=>setStock(e.target.value)}/>
 <button className="btn btn-small" disabled={savingStock||!Number.isSafeInteger(Number(stock))||Number(stock)<0} onClick={adjustStock}>Update stock</button><button className="btn btn-secondary btn-small" disabled={updating} onClick={toggleActive}>{product.isActive?"Deactivate":"Activate"}</button></div>
 {message?<span role="status" className="small muted">{message}</span>:null}</div>;
}
export default function StaffPage(){
 const {token,hydrated,user}=useSelector((s:RootState)=>s.auth);
 const authorized=user?.role==="admin"||user?.role==="manager";
 const [tab,setTab]=useState<"products"|"orders">("products");
 const [page,setPage]=useState(1),[orderPage,setOrderPage]=useState(1);
 const [name,setName]=useState(""),[description,setDescription]=useState(""),[price,setPrice]=useState(""),[stock,setStock]=useState("0"),[message,setMessage]=useState("");
 const {data:products,isLoading:loadingProducts}=useProductsQuery({page,limit:10},{skip:!authorized});
 const {data:orders,isLoading:loadingOrders}=useOrdersQuery({page:orderPage},{skip:!authorized});
 const [create,{isLoading:creating}]=useCreateProductMutation();
 const [updateStatus,{isLoading:changingOrder}]=useUpdateOrderStatusMutation();
 async function addProduct(e:React.FormEvent){e.preventDefault();setMessage("");try{await create({name,description,price,stockQuantity:Number(stock),isActive:true}).unwrap();setName("");setDescription("");setPrice("");setStock("0");setMessage("Product added to catalog.");setPage(1);}catch(err){setMessage(errorMessage(err));}}
 async function changeOrder(id:string,status:string){setMessage("");try{await updateStatus({id,status}).unwrap();setMessage("Order status updated.");}catch(err){setMessage(errorMessage(err));}}
 if(!hydrated||token&&!user)return <div className="spinner"/>;
 if(!token)return <div className="shell"><div className="empty" style={{marginTop:50}}><ShieldAlert size={40}/><h3>Staff sign-in required</h3><p className="muted">Please sign in with a manager or admin account.</p><Link className="btn" href="/login?next=/staff">Sign in</Link></div></div>;
 if(!authorized)return <div className="shell"><div className="empty" style={{marginTop:50}}><ShieldAlert size={40}/><h3>Restricted area</h3><p className="muted">This page is available to managers and administrators only.</p><Link className="btn" href="/">Back to store</Link></div></div>;
 return <div className="shell"><div className="page-heading"><div className="eyebrow">ORDERFLOW MANAGEMENT</div><h1>Store dashboard</h1><p>Manage your inventory and orders with role-based access.</p></div>
 <div className="stats" style={{margin:"5px 0 26px"}}><div className="stat"><Boxes size={28}/><div><strong>{products?.pagination.total??"—"} products</strong><span>Total catalog</span></div></div><div className="stat"><ClipboardList size={28}/><div><strong>{orders?.pagination.total??"—"} orders</strong><span>Orders on record</span></div></div><div className="stat"><Package size={28}/><div><strong>{user.role}</strong><span>Access level</span></div></div></div>
 <div style={{display:"flex",gap:10,marginBottom:22}}><button className={"btn "+(tab!=="products"?"btn-secondary":"")} onClick={()=>setTab("products")}><Boxes size={16}/> Products</button><button className={"btn "+(tab!=="orders"?"btn-secondary":"")} onClick={()=>setTab("orders")}><ClipboardList size={16}/> Orders</button></div>
 {message?<div className={message.endsWith(".")?"message success":"message"} role="status">{message}</div>:null}
 {tab==="products"?<div className="two-col"><div className="panel"><h2 style={{fontSize:22}}>Inventory</h2>{loadingProducts?<div className="spinner"/>:products?.data.length?products.data.map(p=><ProductAdminRow key={p.id} product={p}/>):<p className="muted">No products found.</p>}
 {products&&products.pagination.totalPages>1?<div className="pager"><button className="btn btn-small btn-secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page} of {products.pagination.totalPages}</span><button className="btn btn-small btn-secondary" disabled={page>=products.pagination.totalPages} onClick={()=>setPage(p=>p+1)}>Next</button></div>:null}</div>
 <form className="panel" onSubmit={addProduct}><h2 style={{fontSize:22}}>New product <PlusCircle size={19}/></h2><div className="field"><label htmlFor="pname">Product name</label><input className="input" id="pname" required maxLength={200} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Modern desk lamp"/></div>
 <div className="field"><label htmlFor="pdesc">Description</label><input className="input" id="pdesc" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Short product description"/></div>
 <div className="field"><label htmlFor="pprice">Price (USD)</label><input className="input" id="pprice" required pattern="\d+(\.\d{1,2})?" value={price} onChange={e=>setPrice(e.target.value)} placeholder="29.99"/></div>
 <div className="field"><label htmlFor="pstock">Stock quantity</label><input className="input" type="number" id="pstock" min="0" step="1" required value={stock} onChange={e=>setStock(e.target.value)}/></div><button disabled={creating} className="btn btn-block" type="submit" style={{marginTop:20}}><PlusCircle size={16}/> {creating?"Adding...":"Add product"}</button></form></div>:
 <div className="panel"><h2 style={{fontSize:22}}>Manage orders</h2>{loadingOrders?<div className="spinner"/>:orders?.data.length?orders.data.map(o=><div className="order-row" key={o.id}><div><Link href={"/orders/"+o.id} className="text-link"><strong>#{o.id.slice(0,8).toUpperCase()}</strong></Link><span className="small muted">{money(o.totalAmount,o.currency)} · {new Date(o.createdAt).toLocaleDateString()}</span></div><div style={{display:"flex",gap:10,alignItems:"center"}}><select className="select" aria-label={"Status for order "+o.id} defaultValue={o.status} key={o.id+"-"+o.status} id={"order-"+o.id} style={{width:150}}>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select><button className="btn btn-small" disabled={changingOrder} onClick={()=>{const el=document.getElementById("order-"+o.id) as HTMLSelectElement|null;if(el)void changeOrder(o.id,el.value);}}><RefreshCcw size={14}/> Save</button></div></div>):<p className="muted">No orders yet.</p>}
 {orders&&orders.pagination.totalPages>1?<div className="pager"><button className="btn btn-small btn-secondary" disabled={orderPage===1} onClick={()=>setOrderPage(p=>p-1)}>Previous</button><span>Page {orderPage} of {orders.pagination.totalPages}</span><button className="btn btn-small btn-secondary" disabled={orderPage>=orders.pagination.totalPages} onClick={()=>setOrderPage(p=>p+1)}>Next</button></div>:null}</div>}
 </div>;
}
