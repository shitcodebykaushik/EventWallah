import type { Metadata } from "next";
import { EventDirectory } from "@/components/product/EventDirectory";
export const metadata: Metadata = { title: "Events", description: "Discover upcoming college events and reserve a free QR pass." };
export default function EventsPage(){return <EventDirectory/>;}
