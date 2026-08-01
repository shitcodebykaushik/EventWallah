"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

export function SiteChrome({children}:{children:React.ReactNode}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <main id="main" className="flex-1">{children}</main>;
  return <><SiteHeader/><main id="main" className="flex-1">{children}</main><SiteFooter/><ScrollToTop/></>;
}
