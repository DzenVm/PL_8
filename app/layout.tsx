import type { Metadata } from "next";
import { headers } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { contact } from "@/lib/contact";
import "./globals.css";

const siteUrl = "https://studiadesi.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Wycieczki po Warszawie z przewodnikiem | 5 tras do wyboru",
    template: "%s | Wycieczki po Warszawie",
  },
  description:
    "Piesze wycieczki po Warszawie z licencjonowanym przewodnikiem: Stare Miasto, Trakt Królewski, Powstanie Warszawskie, Łazienki, Praga i Wilanów. Grupy do 20 osób.",
  keywords: [
    "wycieczki po Warszawie",
    "przewodnik Warszawa",
    "zwiedzanie Warszawy",
    "Stare Miasto Warszawa",
    "wycieczka Trakt Królewski",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: siteUrl,
    siteName: "Wycieczki po Warszawie",
    title: "Wycieczki po Warszawie z przewodnikiem",
    description:
      "5 tras spacerowych po Warszawie z licencjonowanym przewodnikiem. Sprawdź terminy i rezerwuj miejsce.",
    images: ["/images/warszawa-panorama.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wycieczki po Warszawie z przewodnikiem",
    description:
      "5 tras spacerowych po Warszawie z licencjonowanym przewodnikiem.",
    images: ["/images/warszawa-panorama.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Wycieczki po Warszawie",
  description:
    "Organizator pieszych wycieczek z przewodnikiem po Warszawie.",
  url: siteUrl,
  address: {
    "@type": "PostalAddress",
    streetAddress: contact.street,
    postalCode: contact.postalCode,
    addressLocality: contact.city,
    addressCountry: "PL",
  },
  telephone: contact.phoneHref.replace("tel:", ""),
  email: contact.email,
  areaServed: {
    "@type": "City",
    name: "Warszawa",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 52.2297,
    longitude: 21.0122,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday"],
      opens: "10:00",
      closes: "14:00",
    },
  ],
  priceRange: "69-95 PLN",
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
