import type { Metadata } from "next";
import Link from "next/link";
import { contact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontakt do pracowni projektowania wnętrz: telefon, e-mail, region obsługi oraz dane firmy.",
  alternates: { canonical: "/kontakt" },
};

export default function ContactPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/">Strona główna</Link> / Kontakt
          </p>
          <h1>Kontakt</h1>
          <p className="lead">
            Zadzwoń lub napisz — ustalimy metraż, potrzeby i terminy, i
            zaproponujemy formę współpracy.
          </p>
        </div>
      </div>

      <div className="section">
        <div className="container detail-grid">
          <div className="prose">
            <h2>Dane kontaktowe</h2>
            <p>
              <strong>Telefon:</strong>{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
              <br />
              <strong>E-mail:</strong>{" "}
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              <br />
              <strong>Godziny pracy:</strong> {contact.hours}
            </p>

            <h2>Region obsługi</h2>
            <p>{contact.region}</p>

            <h2>Jak wygląda pierwszy kontakt</h2>
            <p>
              Przy zgłoszeniu ustalamy metraż pomieszczenia, rodzaj potrzeby
              (pełny projekt, pojedyncze pomieszczenie czy konsultacja) oraz
              orientacyjne terminy. Na tej podstawie proponujemy formę
              współpracy oraz orientacyjną cenę z odpowiedniej strony usługi
              — dokładny kosztorys podajemy po pomiarze.
            </p>

            <h2>Dane firmy</h2>
            <p>
              Jednoosobowa działalność gospodarcza
              <br />
              NIP {contact.nip}, REGON {contact.regon}
              <br />
              {contact.street}, {contact.postalCode} {contact.city}
            </p>
          </div>

          <aside className="info-card">
            <span className="eyebrow">Szybki kontakt</span>
            <p style={{ marginTop: "16px" }}>
              Najszybciej odpowiadamy na telefony w godzinach pracy.
            </p>
            <a
              href={contact.phoneHref}
              className="btn btn--primary"
              style={{ width: "100%", marginBottom: "12px" }}
            >
              Zadzwoń teraz
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="btn btn--outline"
              style={{ width: "100%" }}
            >
              Napisz e-mail
            </a>
          </aside>
        </div>
      </div>
    </>
  );
}
