import { PassView } from "@/components/product/PassView";
export default async function PassPage({params}:{params:Promise<{token:string}>}){const {token}=await params;return <PassView token={token}/>;}
