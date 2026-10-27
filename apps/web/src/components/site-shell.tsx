"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, ArrowRight, LogOut, Package, UserRound, Sprout } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { signedOut } from "@/lib/store";
import { api, useCartQuery } from "@/lib/api";

export function Header() {
  const {token,user,hydrated} = useSelector((s:RootState)=>s.auth);
  const {data:cart} = useCartQuery(undefined,{skip:!hydrated||!token||user?.role!=="customer"});
  const count = cart?.data.reduce((sum,item)=>sum+item.quantity,0) ?? 0;
  const dispatch=useDispatch();
  const router=useRouter(), pathname=usePathname();
  const logout=()=>{ dispatch(signedOut());dispatch(api.util.resetApiState());router.push("/"); };
  return <header className="header"><div className="shell nav">
    <Link href="/" className="brand"><span className="brand-icon"><Sprout size={23}/></span>orderflow<span style={{color:"#80a45e"}}>.</span></Link>
    <nav className="nav-links" aria-label="Main navigation"><Link href="/" aria-current={pathname==="/"?"page":undefined}>Home</Link><Link href="/shop">Shop all</Link><Link href="/orders">My orders</Link><Link href="/about">About project</Link>{user?.role==="admin"||user?.role==="manager"?<Link href="/staff">Dashboard</Link>:null}</nav>
    <div className="nav-actions">
      <Link className="icon-button" href="/cart" aria-label={"View cart: "+count+" items"}><ShoppingBag size={18}/>{count>0?<span>{count}</span>:null}</Link>
      {token?<button className="icon-button" onClick={logout} title="Sign out"><LogOut size={17}/><span className="small">Log out</span></button>:<Link className="icon-button" href="/login"><UserRound size={17}/><span className="small">Sign in</span></Link>}
    </div>
  </div></header>;
}
export function Footer() {
  return <footer className="footer"><div className="shell footer-grid">
    <div><Link href="/" className="brand"><span className="brand-icon"><Package size={20}/></span>orderflow.</Link><p>Thoughtful shopping. Built with Next.js, Redux Toolkit & TypeScript.</p></div>
    <div><Link href="/shop">Shop products <ArrowRight size={15} style={{verticalAlign:"middle"}}/></Link><p>Portfolio demo · No real payments processed.</p></div>
  </div></footer>;
}
