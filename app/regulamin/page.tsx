import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regulamin",
  description:
    "Regulamin uczestnictwa w wycieczkach pieszych po Warszawie: rezerwacja, płatność, odwołanie i zasady uczestnictwa.",
  alternates: { canonical: "/regulamin" },
};

export default function TermsPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/">Strona główna</Link> / Regulamin
          </p>
          <h1>Regulamin uczestnictwa w wycieczkach</h1>
        </div>
      </div>

      <div className="section">
        <div className="container prose" style={{ maxWidth: "760px" }}>
          <h2>1. Postanowienia ogólne</h2>
          <p>
            Niniejszy regulamin określa zasady uczestnictwa w wycieczkach
            pieszych organizowanych na terenie Warszawy. Organizatorem
            wycieczek jest podmiot wskazany w danych kontaktowych na stronie
            internetowej.
          </p>

          <h2>2. Rezerwacja</h2>
          <p>
            Rezerwacji można dokonać telefonicznie lub mailowo, podając
            wybraną trasę, proponowany termin oraz liczbę uczestników.
            Rezerwacja jest potwierdzana przez organizatora po sprawdzeniu
            dostępności terminu.
          </p>

          <h2>3. Płatność</h2>
          <p>
            Sposób i termin płatności ustalane są indywidualnie przy
            potwierdzeniu rezerwacji. Ceny podane przy poszczególnych
            wycieczkach mają charakter orientacyjny i mogą ulec zmianie w
            zależności od terminu, wielkości grupy oraz zakresu usług
            dodatkowych.
          </p>

          <h2>4. Odwołanie i zmiana terminu</h2>
          <p>
            Uczestnik może odwołać lub zmienić termin wycieczki, kontaktując
            się z organizatorem najpóźniej 24 godziny przed planowanym
            rozpoczęciem. W przypadku niekorzystnych warunków atmosferycznych
            zagrażających bezpieczeństwu uczestników organizator zastrzega
            sobie prawo do zmiany terminu wycieczki.
          </p>

          <h2>5. Przebieg wycieczki</h2>
          <p>
            Wycieczki mają charakter pieszy i odbywają się po trasach
            wskazanych na stronie internetowej. Organizator zastrzega sobie
            możliwość niewielkiej modyfikacji trasy lub kolejności punktów
            programu z przyczyn niezależnych (np. remonty, wydarzenia
            miejskie), przy zachowaniu głównych założeń programowych.
          </p>

          <h2>6. Odpowiedzialność uczestników</h2>
          <p>
            Uczestnicy zobowiązani są do stosowania się do wskazówek
            przewodnika oraz zachowania ostrożności podczas przemieszczania
            się po trasie, w szczególności w ruchu miejskim. Organizator nie
            ponosi odpowiedzialności za szkody wynikające z nieprzestrzegania
            wskazówek przewodnika lub obowiązujących przepisów.
          </p>

          <h2>7. Reklamacje</h2>
          <p>
            Reklamacje dotyczące przebiegu wycieczki należy zgłaszać w formie
            pisemnej (e-mail) w terminie 14 dni od daty wycieczki.
            Reklamacja zostanie rozpatrzona w terminie do 14 dni roboczych.
          </p>

          <h2>8. Postanowienia końcowe</h2>
          <p>
            W sprawach nieuregulowanych niniejszym regulaminem zastosowanie
            mają przepisy prawa polskiego, w tym Kodeksu cywilnego oraz
            ustawy o imprezach turystycznych i powiązanych usługach
            turystycznych, w zakresie w jakim mają zastosowanie do
            świadczonych usług.
          </p>

          <p style={{ fontSize: "0.85rem" }}>Ostatnia aktualizacja: lipiec 2026.</p>
        </div>
      </div>
    </>
  );
}
