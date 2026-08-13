import type { Metadata } from "next";
import { headers } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { contact } from "@/lib/contact";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.origin),
  title: {
    default: "Projektowanie wnętrz — 5 rodzajów usług | Konsultacja projektanta",
    template: "%s | Projektowanie wnętrz",
  },
  description:
    "Projekt mieszkania, domu, lokalu komercyjnego i pojedynczych pomieszczeń. Układ funkcjonalny, wizualizacje 3D, dokumentacja wykonawcza, nadzór autorski. Orientacyjne ceny na stronie.",
  keywords: [
    "projektowanie wnętrz",
    "projekt mieszkania",
    "projekt domu",
    "wizualizacje 3D wnętrz",
    "projektant wnętrz Warszawa",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: site.origin,
    siteName: "Projektowanie wnętrz",
    title: "Projektowanie wnętrz — 5 rodzajów usług",
    description:
      "Układ funkcjonalny, wizualizacje 3D, dokumentacja wykonawcza i nadzór autorski. Orientacyjne ceny i terminy na stronie.",
    images: ["/images/plan-pomieszczenia.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Projektowanie wnętrz — 5 rodzajów usług",
    description:
      "Układ funkcjonalny, wizualizacje 3D, dokumentacja wykonawcza i nadzór autorski.",
    images: ["/images/plan-pomieszczenia.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Pracownia projektowania wnętrz",
  description:
    "Pracownia projektowania wnętrz: projekty mieszkań, domów, lokali komercyjnych, pojedynczych pomieszczeń oraz wizualizacje 3D.",
  url: site.origin,
  address: {
    "@type": "PostalAddress",
    streetAddress: contact.street,
    postalCode: contact.postalCode,
    addressLocality: contact.city,
    addressCountry: "PL",
  },
  telephone: contact.phoneHref.replace("tel:", ""),
  email: contact.email,
  taxID: contact.nip,
  areaServed: {
    "@type": "AdministrativeArea",
    name: contact.region,
  },
  priceRange: "od 180 zł/m²",
};

function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="pl">
      <body>
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
