import type { MetadataRoute } from "next";

import { navigation } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.launchbharat.in";

  const lastModified = new Date();

  const staticPages = navigation.map((item) => ({
    url: `${baseUrl}${item.href === "/" ? "" : item.href}`,
    lastModified,
    changeFrequency: item.href === "/" ? "weekly" as const : "monthly" as const,
    priority: item.href === "/" ? 1 : 0.8,
  }));

  return [
    ...staticPages,
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/partner`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
  ];
}
