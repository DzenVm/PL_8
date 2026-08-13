import type { Metadata } from "next";
import Link from "next/link";
import { contact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Informacje o przetwarzaniu danych osobowych oraz plikach cookie na stronie pracowni projektowania wnętrz.",
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
            kontaktem telefonicznym lub mailowym jest przedsiębiorca
            prowadzący jednoosobową działalność gospodarczą, NIP{" "}
            {contact.nip}, z siedzibą przy {contact.street},{" "}
            {contact.postalCode} {contact.city}. Kontakt w sprawach ochrony
            danych: <a href={`mailto:${contact.email}`}>{contact.email}</a>.
          </p>

          <h2>2. Jakie dane są przetwarzane</h2>
          <p>
            Strona nie zawiera formularza automatycznie zbierającego dane
            osobowe. Dane osobowe (imię, numer telefonu, e-mail) są
            przetwarzane wyłącznie wtedy, gdy samodzielnie kontaktujesz się
            telefonicznie lub mailowo w sprawie usług. Dane te są
            wykorzystywane wyłącznie do obsługi zapytania i komunikacji
            dotyczącej projektu oraz przechowywane przez okres niezbędny do
            realizacji usługi.
          </p>
          <p>
            Jeżeli adres wejścia zawiera identyfikator kliknięcia reklamowego
            (<code>gclid</code>, <code>gbraid</code> lub <code>wbraid</code>),
            strona może przetworzyć ten identyfikator oraz dozwolone parametry
            kampanii po stronie serwera. Służy to przypisaniu wejścia do
            kampanii i przekazaniu użytkownika do zadeklarowanej strony
            kampanii. Do zdarzenia przypisywany jest losowy identyfikator
            korelacyjny. Mechanizm nie analizuje typu przeglądarki ani nazwy
            robota w celu wyboru trasy.
          </p>

          <h2>3. Cel, podstawa i odbiorcy pomiaru kampanii</h2>
          <p>
            Identyfikatory wejścia reklamowego i parametry kampanii są
            przetwarzane w celu przypisania wejścia do kampanii, pomiaru jej
            skuteczności, wykrywania błędów technicznych oraz ochrony przed
            nadużyciami. Podstawą jest prawnie uzasadniony interes
            administratora (art. 6 ust. 1 lit. f RODO) polegający na pomiarze i
            zabezpieczeniu własnych kampanii. Mechanizm nie jest używany przez
            tę stronę do profilowania zainteresowań ani retargetingu.
          </p>
          <p>
            Odbiorcami danych mogą być dostawcy hostingu i CDN, operator
            serwera pomiarowego oraz operator zadeklarowanego systemu kampanii
            pod domeną <code>dzentds.top</code>. Po przekierowaniu system
            docelowy otrzymuje również standardowe dane połączenia HTTP, takie
            jak adres IP i User-Agent. PL_8 nie wykorzystuje ich do wyboru
            trasy.
          </p>
          <p>
            Własny dziennik zdarzeń PL_8 nie przechowuje surowego identyfikatora
            kliknięcia: jest on niezwłocznie zastępowany skrótem HMAC.
            Identyfikator korelacyjny, taki skrót oraz dozwolone parametry
            kampanii (na przykład UTM i <code>gad_source</code>) są
            przechowywane maksymalnie przez 30 dni na potrzeby diagnostyki, a
            następnie usuwane przez niezależne, codzienne zadanie retencji.
          </p>

          <h2>4. Pliki cookie i lokalny zapis przeglądarki</h2>
          <p>
            Strona nie wykorzystuje analitycznych ani reklamowych plików
            cookie firm trzecich. Jedyny techniczny wpis znajduje się w
            lokalnej pamięci przeglądarki (localStorage) i przechowuje Twój
            wybór dotyczący banera cookies, aby nie wyświetlał się przy
            każdej wizycie.
          </p>
          <p>
            <strong>Nie korzystamy z:</strong> Google Analytics, Meta Pixel ani
            zewnętrznych skryptów śledzących uruchamianych w przeglądarce.
            Pomiar wejść reklamowych opisany powyżej odbywa się wyłącznie po
            stronie serwera. Strona nie zawiera zewnętrznych widżetów
            społecznościowych. Szczegóły — w{" "}
            <Link href="/polityka-cookies">polityce cookies</Link>.
          </p>

          <h2>5. Hosting</h2>
          <p>
            Strona jest hostowana na infrastrukturze dostawcy usług
            hostingowych, który w ramach standardowego działania serwerów
            może przetwarzać podstawowe logi techniczne (adres IP, czas
            zapytania, typ przeglądarki) w celu zapewnienia bezpieczeństwa i
            prawidłowego działania usługi.
          </p>

          <h2>6. Twoje prawa</h2>
          <p>
            W zakresie danych przekazanych podczas kontaktu przysługuje Ci
            prawo dostępu do danych, ich sprostowania, usunięcia oraz
            ograniczenia przetwarzania. W tym celu skontaktuj się pod adresem{" "}
            <a href={`mailto:${contact.email}`}>{contact.email}</a>.
            Przysługuje Ci również prawo wniesienia skargi do Prezesa Urzędu
            Ochrony Danych Osobowych. W przypadku przetwarzania opartego na
            prawnie uzasadnionym interesie możesz również wnieść sprzeciw.
          </p>

          <h2>7. Zmiany polityki</h2>
          <p>
            Niniejsza polityka może być aktualizowana w związku ze zmianami w
            funkcjonalności strony. Aktualna wersja jest zawsze dostępna pod
            tym adresem.
          </p>
          <p style={{ fontSize: "0.85rem" }}>
            Ostatnia aktualizacja: sierpień 2026.
          </p>
        </div>
      </div>
    </>
  );
}
