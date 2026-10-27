"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useProductsQuery } from "@/lib/api";
import { ProductCard } from "@/components/product-card";

export default function ShopPage(){
 const [draft,setDraft]=useState(""),[search,setSearch]=useState(""),[sort,setSort]=useState("createdAt:desc"),[availability,setAvailability]=useState("all"),[page,setPage]=useState(1);
 const [sortBy,sortOrder]=sort.split(":");
 const {data,isLoading,isError}=useProductsQuery({page,limit:12,search,isActive:availability==="all"?undefined:availability,sortBy,sortOrder});
 const total=data?.pagination.total??0,totalPages=data?.pagination.totalPages??0;
 return <div className="shell"><div className="page-heading"><div className="eyebrow">THE COLLECTION</div><h1>Discover your next favorite.</h1><p>Thoughtful products for the moments that matter.</p></div>
 <form className="filters" onSubmit={e=>{e.preventDefault();setSearch(draft);setPage(1);}}>
   <div className="search-field"><Search size={19} color="#7b8b7d"/><input aria-label="Search products" placeholder="Search the collection..." value={draft} onChange={e=>setDraft(e.target.value)}/></div>
   <button type="submit" className="btn btn-small">Search</button>
   <SlidersHorizontal size={18} color="#7b8b7d"/>
   <select className="select" aria-label="Availability" value={availability} onChange={e=>{setAvailability(e.target.value);setPage(1);}}><option value="all">All availability</option><option value="true">Active products</option><option value="false">Inactive products</option></select>
   <select className="select" aria-label="Sort products" value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="createdAt:desc">Newest first</option><option value="createdAt:asc">Oldest first</option><option value="price:asc">Price: low to high</option><option value="price:desc">Price: high to low</option><option value="name:asc">Name: A to Z</option></select>
 </form>
 <div className="small muted" style={{marginBottom:18}}>{isLoading?"Loading products...":total+" products found"}</div>
 {isError?<div className="message">Unable to load the catalog. Verify that the backend is running.</div>:isLoading?<div className="spinner"/>:data?.data.length?<div className="product-grid">{data.data.map(p=><ProductCard product={p} key={p.id}/>)}</div>:<div className="empty"><Search size={35}/><h3>No products found</h3><p className="muted">Try another search term or filter.</p><button className="btn btn-secondary" onClick={()=>{setDraft("");setSearch("");setAvailability("all");setPage(1);}}>Clear filters</button></div>}
 {totalPages>1?<div className="pager"><button className="icon-button" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/> Previous</button><span className="small muted">Page {page} of {totalPages}</span><button className="icon-button" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next <ChevronRight size={16}/></button></div>:null}
 </div>;
}
