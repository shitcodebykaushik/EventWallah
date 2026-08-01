import { EventEditor } from "@/components/admin/EventEditor";
export default async function ManageEventPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <EventEditor id={id}/>;}
