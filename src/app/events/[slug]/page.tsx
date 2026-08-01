import { EventDetail } from "@/components/product/EventDetail";
export default async function EventPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <EventDetail slug={slug}/>;}
