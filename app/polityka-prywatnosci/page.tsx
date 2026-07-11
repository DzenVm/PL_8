import type { Metadata } from "next";
import Link from "next/link";
import { contact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Informacje o przetwarzaniu danych osobowych oraz plikach cookie na stronie internetowej.",
  alternates: { canonical: "/polityka-prywatnosci" },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/">Strona główna</Link> / Polityka prywatności
          </p>
          <h1>Polityka prywatności</h1>
        </div>
      </div>

      <div className="section">
        <div className="container prose" style={{ maxWidth: "760px" }}>
          <h2>1. Administrator danych</h2>
          <p>
            Administratorem danych osobowych przetwarzanych w związku z
            kontaktem poprzez telefon lub e-mail jest organizator wycieczek
            pieszych po Warszawie, z siedzibą przy {contact.street},{" "}
            {contact.postalCode} {contact.city}. Kontakt w sprawach ochrony
            danych:{" "}
            <a href={`mailto:${contact.email}`}>{contact.email}</a>.
          </p>

          <h2>2. Jakie dane przetwarzamy</h2>
          <p>
            Strona internetowa nie zawiera formularza zbierającego dane
            osobowe. Dane osobowe (imię, numer telefonu, adres e-mail)
            przetwarzane są wyłącznie w przypadku, gdy użytkownik samodzielnie
            skontaktuje się z nami telefonicznie lub mailowo w celu rezerwacji
            wycieczki. Dane te wykorzystujemy wyłącznie do obsługi zapytania i
            rezerwacji oraz przechowujemy przez okres niezbędny do realizacji
            usługi i wynikający z przepisów prawa (np. podatkowych).
          </p>

          <h2>3. Pliki cookie i lokalny zapis przeglądarki</h2>
          <p>
            Strona wykorzystuje wyłącznie niezbędny, techniczny zapis w
            pamięci lokalnej przeglądarki (localStorage), który przechowuje
            informację o Twoim wyborze dotyczącym banera cookies, aby nie
            wyświetlał się przy każdej wizycie. Nie ustawiamy plików cookie
            analitycznych, marketingowych ani reklamowych.
          </p>
          <p>
            <strong>Nie korzystamy z:</strong> Google Analytics, Google Ads,
            Meta Pixel ani innych narzędzi śledzących. Strona nie zawiera
            skryptów firm trzecich ani wtyczek społecznościowych. Szczegóły
            dotyczące poszczególnych kategorii znajdziesz w{" "}
            <Link href="/polityka-cookies">polityce cookies</Link>.
          </p>

          <h2>4. Hosting</h2>
          <p>
            Strona jest hostowana na infrastrukturze dostawcy usług
            hostingowych, który w ramach standardowego działania serwerów może
            przetwarzać podstawowe logi techniczne (adres IP, znacznik czasu,
            typ przeglądarki) w celu zapewnienia bezpieczeństwa i
            prawidłowego działania usługi.
          </p>

          <h2>5. Twoje prawa</h2>
          <p>
            W zakresie danych przekazanych nam podczas kontaktu przysługuje Ci
            prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia
            przetwarzania oraz wniesienia sprzeciwu. W tym celu skontaktuj się
            z nami pod adresem{" "}
            <a href={`mailto:${contact.email}`}>{contact.email}</a>. Przysługuje
            Ci również prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych
            Osobowych.
          </p>

          <h2>6. Zmiany polityki</h2>
          <p>
            Niniejsza polityka może być aktualizowana w związku ze zmianami w
            funkcjonalności strony. Aktualna wersja jest zawsze dostępna pod
            tym adresem.
          </p>
          <p style={{ fontSize: "0.85rem" }}>Ostatnia aktualizacja: lipiec 2026.</p>
        </div>
      </div>
    </>
  );
}
