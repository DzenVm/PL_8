import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Polityka cookies",
  description:
    "Informacje o plikach cookie oraz lokalnym zapisie przeglądarki wykorzystywanym na stronie.",
  alternates: { canonical: "/polityka-cookies" },
};

export default function CookiePolicyPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/">Strona główna</Link> / Polityka cookies
          </p>
          <h1>Polityka cookies</h1>
        </div>
      </div>

      <div className="section">
        <div className="container prose" style={{ maxWidth: "760px" }}>
          <h2>Czym są pliki cookie</h2>
          <p>
            Pliki cookie to małe pliki tekstowe zapisywane w przeglądarce
            urządzenia użytkownika. W przypadku tej strony pojęcie to
            obejmuje również zapis w pamięci lokalnej przeglądarki
            (localStorage), który pełni podobną funkcję.
          </p>

          <h2>Jakich kategorii używamy</h2>

          <h3>Niezbędne (zawsze aktywne)</h3>
          <p>
            Pojedynczy wpis w localStorage przechowujący informację, czy
            zaakceptowałeś(-aś) lub odrzuciłeś(-aś) baner cookies. Bez tego
            wpisu baner wyświetlałby się przy każdej wizycie. Ten zapis nie
            jest przekazywany żadnemu podmiotowi zewnętrznemu.
          </p>

          <h3>Funkcjonalne (opcjonalne)</h3>
          <p>
            Zarezerwowana kategoria dla ustawień poprawiających wygodę
            korzystania ze strony (np. zapamiętanie rozwiniętych sekcji
            FAQ). Można je włączyć lub wyłączyć w ustawieniach banera
            cookies — wyłączenie nie ogranicza dostępu do treści strony.
          </p>

          <h3>Analityczne i marketingowe</h3>
          <p>
            <strong>Nie są wykorzystywane.</strong> Strona nie zawiera
            skryptów Google Analytics, Google Ads, Meta Pixel ani żadnych
            innych narzędzi analitycznych lub reklamowych firm trzecich.
          </p>

          <h2>Zarządzanie zgodą</h2>
          <p>
            Swój wybór możesz w każdej chwili zmienić, czyszcząc dane strony
            (localStorage) w ustawieniach swojej przeglądarki — baner
            cookies pojawi się ponownie przy kolejnej wizycie.
          </p>

          <p style={{ fontSize: "0.85rem" }}>Ostatnia aktualizacja: lipiec 2026.</p>
        </div>
      </div>
    </>
  );
}
