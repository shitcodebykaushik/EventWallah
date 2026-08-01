import { RegistrationForm } from "@/components/product/RegistrationForm";
export default async function RegisterPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <RegistrationForm slug={slug}/>;}
