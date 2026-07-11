import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { tours, getTourBySlug } from "@/lib/tours";

export function generateStaticParams() {
  return tours.map((tour) => ({ slug: tour.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tour = getTourBySlug(slug);

  if (!tour) {
    return {};
  }

  return {
    title: tour.title,
    description: tour.metaDescription,
    alternates: {
      canonical: `/wycieczki/${tour.slug}`,
    },
    openGraph: {
      title: tour.title,
      description: tour.metaDescription,
      url: `/wycieczki/${tour.slug}`,
    },
  };
}

function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default async function TourPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = getTourBySlug(slug);

  if (!tour) {
    notFound();
  }

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const otherTours = tours.filter((item) => item.slug !== tour.slug);
  const priceMatch = tour.price.match(/\d+/);
  const siteUrl = "https://studiadesi.site";

  const tourJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.metaDescription,
    touristType: "Turyści indywidualni i grupy zorganizowane",
    itinerary: {
      "@type": "ItemList",
      itemListElement: tour.itinerary.map((stop, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: stop.title,
        description: stop.description,
      })),
    },
    offers: priceMatch
      ? {
          "@type": "Offer",
          price: priceMatch[0],
          priceCurrency: "PLN",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/wycieczki/${tour.slug}`,
        }
      : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Strona główna", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Wycieczki",
        item: `${siteUrl}/#wycieczki`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tour.title,
        item: `${siteUrl}/wycieczki/${tour.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(tourJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/">Strona główna</Link> / <Link href="/#wycieczki">Wycieczki</Link> /{" "}
            {tour.title}
          </p>
          <h1>{tour.title}</h1>
          <p className="lead">{tour.shortDescription}</p>
        </div>
      </div>

      <div className="section">
        <div className="container detail-grid">
          <div>
            <h2>Program wycieczki</h2>
            <div>
              {tour.itinerary.map((stop) => (
                <div className="itinerary-item" key={stop.title}>
                  <time>{stop.time}</time>
                  <div>
                    <h3 style={{ marginBottom: "0.3em", fontSize: "1.05rem" }}>
                      {stop.title}
                    </h3>
                    <p style={{ margin: 0 }}>{stop.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2>Najważniejsze punkty trasy</h2>
            <ul className="tag-list">
              {tour.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Co zawiera cena</h2>
            <ul className="tag-list">
              {tour.included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Czego nie obejmuje cena</h2>
            <ul className="tag-list">
              {tour.notIncluded.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Dobrze wiedzieć</h2>
            <ul className="tag-list">
              {tour.goodToKnow.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className="info-card">
            <span className="eyebrow">Szczegóły wycieczki</span>
            <dl>
              <dt>Cena</dt>
              <dd>{tour.price}</dd>
              <dt>Czas trwania</dt>
              <dd>{tour.duration}</dd>
              <dt>Wielkość grupy</dt>
              <dd>{tour.groupSize}</dd>
              <dt>Język</dt>
              <dd>{tour.language}</dd>
              <dt>Miejsce zbiórki</dt>
              <dd>{tour.meetingPoint}</dd>
            </dl>
            <Link
              href="/kontakt"
              className="btn btn--primary"
              style={{ width: "100%", marginTop: "24px" }}
            >
              Zapytaj o termin
            </Link>
          </aside>
        </div>
      </div>

      <section className="section section--alt">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Zobacz też</span>
            <h2>Pozostałe wycieczki</h2>
          </div>
          <div className="other-tours">
            {otherTours.map((item) => (
              <Link
                key={item.slug}
                href={`/wycieczki/${item.slug}`}
                className="tour-card"
                style={{ textDecoration: "none" }}
              >
                <h3>{item.title}</h3>
                <p>{item.shortDescription}</p>
                <span className="link-arrow">Zobacz szczegóły →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
