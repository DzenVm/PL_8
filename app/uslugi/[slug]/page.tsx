import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { services, stages, getServiceBySlug } from "@/lib/services";

const siteUrl = "https://pracownia-wnetrz.example";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {};
  }

  return {
    title: service.title,
    description: service.metaDescription,
    alternates: {
      canonical: `/uslugi/${service.slug}`,
    },
    openGraph: {
      title: service.title,
      description: service.metaDescription,
      url: `/uslugi/${service.slug}`,
    },
  };
}

function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const otherServices = services.filter((item) => item.slug !== service.slug);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.title,
    name: service.title,
    description: service.metaDescription,
    provider: {
      "@type": "ProfessionalService",
      name: "Pracownia projektowania wnętrz",
    },
    offers: {
      "@type": "Offer",
      priceSpecification: {
        "@type": "PriceSpecification",
        price: service.priceFrom,
        priceCurrency: "PLN",
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Strona główna", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Usługi",
        item: `${siteUrl}/#uslugi`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.title,
        item: `${siteUrl}/uslugi/${service.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/">Strona główna</Link> / <Link href="/#uslugi">Usługi</Link> /{" "}
            {service.title}
          </p>
          <h1>{service.title}</h1>
          <p className="lead">{service.shortDescription}</p>
        </div>
      </div>

      <div className="section">
        <div className="container detail-grid">
          <div>
            <h2>Etapy pracy</h2>
            <div>
              {stages.map((stage, index) => (
                <div className="stage-item" key={stage.title}>
                  <span className="stage-item__num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 style={{ marginBottom: "0.3em", fontSize: "1.02rem" }}>
                      {stage.title}
                    </h3>
                    <p style={{ margin: 0 }}>{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2>Co obejmuje usługa</h2>
            <ul className="tag-list">
              {service.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Czego nie obejmuje</h2>
            <ul className="tag-list">
              {service.notIncluded.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Warto wiedzieć</h2>
            <ul className="tag-list">
              {service.goodToKnow.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className="info-card">
            <span className="eyebrow">Orientacyjne warunki</span>
            <dl>
              <dt>Cena</dt>
              <dd>{service.priceFrom}</dd>
              <dt>Termin</dt>
              <dd>{service.duration}</dd>
            </dl>
            <p style={{ fontSize: "0.85rem", marginTop: "16px" }}>
              {service.priceNote}
            </p>
            <Link
              href="/kontakt"
              className="btn btn--primary"
              style={{ width: "100%", marginTop: "8px" }}
            >
              Omów projekt
            </Link>
          </aside>
        </div>
      </div>

      <section className="section section--alt">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Inne usługi</span>
            <h2>Pozostałe usługi pracowni</h2>
          </div>
          <div className="other-services">
            {otherServices.map((item) => (
              <Link
                key={item.slug}
                href={`/uslugi/${item.slug}`}
                className="other-service-card"
              >
                <h3>{item.title}</h3>
                <p>{item.shortDescription}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
