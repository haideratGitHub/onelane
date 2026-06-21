import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * XML sitemap, served at /sitemap.xml. Add a row here when you add an indexable
 * page. `lastModified` uses build time.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/support`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
