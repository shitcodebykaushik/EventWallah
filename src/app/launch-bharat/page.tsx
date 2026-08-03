import type { Metadata } from "next";
import { LaunchBharatExperience } from "@/components/launch-bharat/LaunchBharatExperience";

export const metadata: Metadata = {
  title: "Launch Bharat — National Student Startup Programme",
  description: "The Event Wallah's flagship national programme for college teams developing and presenting practical startup solutions.",
};

export default function LaunchBharatPage() {
  return <LaunchBharatExperience />;
}
