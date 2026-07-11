import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const siteUrl = "https://wycieczki-warszawa.example";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Wycieczki po Warszawie z przewodnikiem | 5 tras do wyboru",
    template: "%s | Wycieczki po Warszawie",
  },
  description:
    "Piesze wycieczki po Warszawie z licencjonowanym przewodnikiem: Stare Miasto, Trakt Królewski, Powstanie Warszawskie, Łazienki, Praga i Wilanów. Grupy do 20 osób.",
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
  address: {
    "@type": "PostalAddress",
    streetAddress: "ul. Marszałkowska 10",
    postalCode: "00-590",
    addressLocality: "Warszawa",
    addressCountry: "PL",
  },
  telephone: "+48221234567",
  areaServed: "Warszawa",
  priceRange: "69-95 PLN",
};

function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>
        <script
          type="application/ld+json"
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
