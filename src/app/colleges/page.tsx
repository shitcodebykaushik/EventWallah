import type { Metadata } from "next";
import { CollegeDirectory } from "@/components/product/CollegeDirectory";
export const metadata: Metadata = { title: "Colleges", description: "Search colleges and universities across India and discover their upcoming events." };
export default async function CollegesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  return <CollegeDirectory initialQuery={q.slice(0, 120)} />;
}
