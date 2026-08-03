import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.eventwallah.com";
  const lastModified = new Date();
	const publicPaths = ["/", "/launch-bharat", "/events", "/colleges", "/for-students", "/about", "/contact"];
  const staticPages = publicPaths.map((href) => ({
    url: `${baseUrl}${href === "/" ? "" : href}`,
    lastModified,
    changeFrequency: href === "/events" ? "daily" as const : "weekly" as const,
    priority: href === "/" ? 1 : 0.8,
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
  ];
}
