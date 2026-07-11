import type { MetadataRoute } from "next";
import { services } from "@/lib/services";

const siteUrl = "https://pracownia-wnetrz.example";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/o-pracowni",
    "/kontakt",
    "/polityka-prywatnosci",
    "/polityka-cookies",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const serviceRoutes = services.map((service) => ({
    url: `${siteUrl}/uslugi/${service.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...serviceRoutes];
}
