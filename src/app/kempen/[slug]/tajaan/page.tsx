import{bankTransfer}from"@/lib/payments/bank";
import {notFound}from "next/navigation";import {publicContext}from "@/lib/ramadan/server";import {RamadanCheckout}from "@/components/public/ramadan-checkout";import {Container,Section}from "@/components/design-system";import type {Metadata}from "next";
export const dynamic="force-dynamic";export const revalidate=0;export const metadata:Metadata={title:"Tajaan Ramadan",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const c=await publicContext(slug);if(!c)notFound();return <Section tone="ivory"><Container width="narrow"><RamadanCheckout context={c} bank={bankTransfer}/></Container></Section>;}
