import type { Metadata } from "next";
import Link from "next/link";

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
              <strong>Telefon:</strong>{" "}
              <a href="tel:+48221234567">+48 22 123 45 67</a>
              <br />
              <strong>E-mail:</strong>{" "}
              <a href="mailto:kontakt@wycieczki-warszawa.example">
                kontakt@wycieczki-warszawa.example
              </a>
              <br />
              <strong>Godziny pracy biura:</strong> poniedziałek–piątek,
              9:00–17:00
            </p>

            <h2>Adres biura</h2>
            <p>
              ul. Marszałkowska 10
              <br />
              00-590 Warszawa
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
          </div>

          <aside className="info-card">
            <span className="eyebrow">Szybki kontakt</span>
            <p style={{ marginTop: "16px" }}>
              Najszybciej odpowiadamy na zapytania telefoniczne w godzinach
              pracy biura.
            </p>
            <a href="tel:+48221234567" className="btn btn--primary" style={{ width: "100%" }}>
              Zadzwoń teraz
            </a>
          </aside>
        </div>
      </div>
    </>
  );
}
