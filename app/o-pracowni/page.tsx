import type { Metadata } from "next";
import Link from "next/link";
import { contact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "O pracowni",
  description:
    "O podejściu pracowni projektowania wnętrz: jak budujemy koncepcję, pracujemy z budżetem i towarzyszymy klientowi do zakończenia remontu.",
  alternates: { canonical: "/o-pracowni" },
};

export default function AboutPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/">Strona główna</Link> / O pracowni
          </p>
          <h1>O pracowni</h1>
          <p className="lead">
            Prywatna praktyka projektowania wnętrz, pracująca według jednej
            metodologii dla każdej z pięciu usług.
          </p>
        </div>
      </div>

      <div className="section">
        <div className="container prose" style={{ maxWidth: "760px" }}>
          <h2>Podejście do pracy</h2>
          <p>
            Każdy projekt zaczyna się nie od wizualizacji, lecz od układu
            funkcjonalnego: analizy, jak pomieszczenie jest używane na co
            dzień, jakie są przyzwyczajenia domowników i jakie ograniczenia
            narzuca sam budynek — ściany nośne, instalacje, okna. Dopiero
            potem powstaje koncepcja stylistyczna.
          </p>

          <h2>Forma współpracy</h2>
          <p>
            Dla mieszkań i domów oferujemy pełen cykl — od pomiaru po nadzór
            autorski. Przy zleceniach punktowych (pojedyncze pomieszczenie,
            konsultacja bez pełnego projektu) można zamówić tylko potrzebny
            etap, bez przepłacania za pakiet, który nie zostanie
            wykorzystany.
          </p>

          <h2>Materiały i wykonawcy</h2>
          <p>
            W projektach nie używamy nazw konkretnych marek mebli, armatury
            czy materiałów wykończeniowych jako reklamy ani wskazania na
            partnerstwo — rekomendacje dotyczą typu i parametrów materiału, a
            markę i dostawcę klient wybiera samodzielnie lub w konsultacji z
            projektantem.
          </p>

          <h2>Przykłady realizacji</h2>
          <p>
            Podane na stronie orientacyjne terminy i zakresy prac opierają
            się na typowych projektach danej kategorii. Konkretne realizacje
            i portfolio udostępniamy na życzenie podczas pierwszego kontaktu.
          </p>

          <h2>Dane firmy</h2>
          <p>
            Jednoosobowa działalność gospodarcza
            <br />
            NIP {contact.nip}, REGON {contact.regon}
            <br />
            Region obsługi: {contact.region}
          </p>
        </div>
      </div>
    </>
  );
}
