"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useLoginMutation, useRegisterMutation, api } from "@/lib/api";
import { signedIn, setUser } from "@/lib/store";
import { errorMessage } from "@/lib/types";

export function AuthForm({mode}:{mode:"login"|"register"}) {
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState("");
 const [login,{isLoading:loggingIn}]=useLoginMutation(),[register,{isLoading:registering}]=useRegisterMutation();
 const router=useRouter(),search=useSearchParams(),dispatch=useDispatch();
 const isRegister=mode==="register", busy=loggingIn||registering;
 async function submit(event:React.FormEvent){
  event.preventDefault();setError("");
  try{
   const result= isRegister ? await register({name:name.trim(),email:email.trim(),password}).unwrap() : await login({email:email.trim(),password}).unwrap();
   dispatch(api.util.resetApiState());
   dispatch(signedIn(result.data.accessToken));
   dispatch(setUser({userId:result.data.user.id,customerId:result.data.user.customerId,role:result.data.user.role}));
   const target=search.get("next");
   router.replace(target?.startsWith("/")&&!target.startsWith("//")?target:result.data.user.role==="customer"?"/shop":"/staff");
  }catch(e){setError(errorMessage(e));}
 }
 return <div className="auth-wrap"><div className="auth-card">
  <div className="brand-icon" style={{marginBottom:20}}><LockKeyhole size={20}/></div>
  <div className="eyebrow">{isRegister?"START YOUR JOURNEY":"WELCOME BACK"}</div>
  <h1 style={{margin:"8px 0"}}>{isRegister?"Create your account":"Sign in to OrderFlow"}</h1>
  <p className="muted small">{isRegister?"Join our demo store in just a moment.":"Access your cart, orders and saved progress."}</p>
  <form onSubmit={submit}>
   {isRegister?<div className="field"><label htmlFor="full-name">Your name</label><div className="search-field"><UserRound size={16}/><input id="full-name" value={name} onChange={e=>setName(e.target.value)} minLength={1} maxLength={150} required placeholder="Your full name"/></div></div>:null}
   <div className="field"><label htmlFor="email">Email address</label><div className="search-field"><Mail size={16}/><input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"/></div></div>
   <div className="field"><label htmlFor="password">Password</label><div className="search-field"><LockKeyhole size={16}/><input id="password" type="password" autoComplete={isRegister?"new-password":"current-password"} minLength={isRegister?12:1} required value={password} onChange={e=>setPassword(e.target.value)} placeholder={isRegister?"At least 12 characters":"Enter your password"}/></div></div>
   {error?<div role="alert" className="message">{error}</div>:null}
   <button type="submit" className="btn btn-block" disabled={busy}>{busy?"Please wait...":isRegister?"Create account":"Sign in"} <ArrowRight size={16}/></button>
  </form>
  <div className="auth-switch">{isRegister?"Already have an account? ":"New to OrderFlow? "}<Link className="text-link" href={isRegister?"/login":"/register"}>{isRegister?"Sign in":"Create an account"}</Link></div>
 </div></div>;
}
