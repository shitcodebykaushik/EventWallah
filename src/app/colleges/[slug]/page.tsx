import { CollegeProfile } from "@/components/product/CollegeProfile";
export default async function CollegePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <CollegeProfile slug={slug}/>;}
