import type {Metadata} from "next";
import {PublicPageLayout} from "@/components/public/public-page-layout";
import {Container,Section} from "@/components/design-system";
import {PaymentAccess} from "@/components/qurban/payment-form";
import {paymentSession,readPayment} from "@/lib/qurban/payment";
import {publicCampaignSlug} from "@/lib/campaigns/public-contract";
import {notFound} from "next/navigation";
export const dynamic="force-dynamic";export const revalidate=0;
export const metadata:Metadata={title:"Hantar bukti bayaran Qurban",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!publicCampaignSlug(slug))notFound();const session=await paymentSession();let context;try{context=await readPayment(slug,session);}catch{return <PublicPageLayout title="Akses bayaran tidak tersedia" introduction="Sila cuba lagi kemudian."><p role="status">Maklumat bayaran tidak dimuatkan.</p></PublicPageLayout>;}return <PublicPageLayout eyebrow="Qurban / Aqiqah" title="Bukti bayaran" introduction="Penghantaran bukti tidak bermaksud bayaran telah disahkan. Pihak masjid akan menyemak bukti pembayaran." contentLayout="sections"><Section tone="ivory"><Container width="narrow"><PaymentAccess slug={slug} context={context}/></Container></Section></PublicPageLayout>;}
