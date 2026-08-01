import type { Metadata } from "next";
import { CollegeDirectory } from "@/components/product/CollegeDirectory";
export const metadata: Metadata = { title: "Colleges", description: "Search colleges and universities across India and discover their upcoming events." };
export default function CollegesPage(){return <CollegeDirectory/>;}
