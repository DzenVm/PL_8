import type { Metadata } from "next";
import Link from "next/link";
import { contact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Skontaktuj się z organizatorem wycieczek pieszych po Warszawie. Telefon, e-mail oraz adres biura.",
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
            Masz pytania dotyczące wycieczek, terminów lub grup zorganizowanych?
            Skontaktuj się z nami — odpowiadamy w dni robocze w ciągu 24 godzin.
          </p>
        </div>
      </div>

      <div className="section">
        <div className="container detail-grid">
          <div className="prose">
            <h2>Dane kontaktowe</h2>
            <p>
              <strong>Telefon (biuro):</strong>{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
              <br />
              <strong>Telefon/WhatsApp (rezerwacje last-minute):</strong>{" "}
              <a href={contact.mobileHref}>{contact.mobileDisplay}</a>
              <br />
              <strong>E-mail:</strong>{" "}
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              <br />
              <strong>Godziny pracy biura:</strong> {contact.hours}
            </p>

            <h2>Adres biura</h2>
            <p>
              {contact.street}
              <br />
              {contact.postalCode} {contact.city}
              <br />
              Polska
            </p>

            <h2>Rezerwacja grupowa</h2>
            <p>
              W przypadku grup zorganizowanych (szkoły, firmy, grupy
              turystyczne powyżej 15 osób) prosimy o kontakt telefoniczny lub
              mailowy z podaniem: preferowanej wycieczki, liczby uczestników,
              proponowanego terminu oraz danych kontaktowych osoby
              odpowiedzialnej za rezerwację.
            </p>

            <h2>Dane firmy</h2>
            <p>
              NIP: {contact.nip}
              <br />
              REGON: {contact.regon}
            </p>
          </div>

          <aside className="info-card">
            <span className="eyebrow">Szybki kontakt</span>
            <p style={{ marginTop: "16px" }}>
              Najszybciej odpowiadamy na zapytania telefoniczne w godzinach
              pracy biura. Poza godzinami pracy napisz SMS lub WhatsApp na
              numer kontaktowy — oddzwonimy następnego dnia roboczego.
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
