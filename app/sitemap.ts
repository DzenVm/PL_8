import type { MetadataRoute } from "next";
import { tours } from "@/lib/tours";

const siteUrl = "https://wycieczki-warszawa.example";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/kontakt",
    "/regulamin",
    "/polityka-prywatnosci",
    "/polityka-cookies",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const tourRoutes = tours.map((tour) => ({
    url: `${siteUrl}/wycieczki/${tour.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...tourRoutes];
}
