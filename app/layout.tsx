import type { Metadata } from "next";
import { headers } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { contact } from "@/lib/contact";
import "./globals.css";

const siteUrl = "https://studio-interier.example";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Дизайн інтер'єру — 5 напрямків послуг | Консультація дизайнера",
    template: "%s | Дизайн інтер'єру",
  },
  description:
    "Дизайн квартири, будинку, комерційного приміщення та окремих кімнат. Планування, 3D-візуалізація, робоча документація, авторський нагляд. Орієнтовні ціни на сайті.",
  keywords: [
    "дизайн інтер'єру",
    "дизайн квартири",
    "дизайн будинку",
    "3D-візуалізація інтер'єру",
    "дизайнер інтер'єру Київ",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: siteUrl,
    siteName: "Дизайн інтер'єру",
    title: "Дизайн інтер'єру — 5 напрямків послуг",
    description:
      "Планування, 3D-візуалізація, робоча документація та авторський нагляд. Орієнтовні ціни та терміни на сайті.",
    images: ["/images/planuvannya-liniyy.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Дизайн інтер'єру — 5 напрямків послуг",
    description:
      "Планування, 3D-візуалізація, робоча документація та авторський нагляд.",
    images: ["/images/planuvannya-liniyy.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "[НАЗВА СТУДІЇ]",
  legalName: contact.legalName,
  description:
    "Студія дизайну інтер'єру: дизайн квартир, будинків, комерційних приміщень, окремих кімнат та 3D-візуалізація.",
  url: siteUrl,
  address: {
    "@type": "PostalAddress",
    addressLocality: contact.city,
    addressCountry: "UA",
  },
  telephone: contact.phoneHref.replace("tel:", ""),
  email: contact.email,
  areaServed: {
    "@type": "AdministrativeArea",
    name: contact.region,
  },
  priceRange: "від 750 грн/м²",
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
    <html lang="uk">
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
