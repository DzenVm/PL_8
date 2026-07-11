import type { MetadataRoute } from "next";
import { services } from "@/lib/services";

const siteUrl = "https://studio-interier.example";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/pro-studiyu",
    "/kontakty",
    "/polityka-konfidentsiynosti",
    "/polityka-cookies",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const serviceRoutes = services.map((service) => ({
    url: `${siteUrl}/poslugy/${service.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...serviceRoutes];
}
