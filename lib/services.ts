export interface Service {
  slug: string;
  title: string;
  shortDescription: string;
  metaDescription: string;
  priceFrom: string;
  priceNote: string;
  duration: string;
  includes: string[];
  notIncluded: string[];
  goodToKnow: string[];
}

export const stages = [
  {
    title: "Pomiar pomieszczenia",
    description:
      "Wizyta na miejscu, obmiar wszystkich pomieszczeń, lokalizacja instalacji, okien i otworów drzwiowych oraz ograniczeń technicznych.",
  },
  {
    title: "Koncepcja",
    description:
      "Rozwiązanie funkcjonalne, strefowanie, warianty rozstawienia mebli, dobór stylistyki i palety kolorów.",
  },
  {
    title: "Wizualizacja 3D",
    description:
      "Fotorealistyczne wizualizacje każdego pomieszczenia z wybranym ostatecznym rozwiązaniem materiałowym i oświetleniowym.",
  },
  {
    title: "Dokumentacja wykonawcza",
    description:
      "Rysunki dla ekipy remontowej: plan demontażu/montażu, układ płytek, plan instalacji elektrycznej i oświetlenia, specyfikacja materiałów.",
  },
  {
    title: "Nadzór autorski",
    description:
      "Cykliczne wizyty projektanta na budowie w celu kontroli zgodności realizacji z projektem i bieżącego rozwiązywania pojawiających się kwestii.",
  },
];

export const services: Service[] = [
  {
    slug: "projekt-mieszkania-pod-klucz",
    title: "Projekt mieszkania pod klucz",
    shortDescription:
      "Pełen cykl — od rozwiązania funkcjonalnego po nadzór autorski nad remontem mieszkania.",
    metaDescription:
      "Projekt wnętrza mieszkania pod klucz: układ funkcjonalny, wizualizacje 3D, dokumentacja wykonawcza, nadzór autorski. Orientacyjna wycena od 180 zł/m².",
    priceFrom: "od 180 zł/m²",
    priceNote:
      "Orientacyjna cena za powierzchnię użytkową mieszkania. Ostateczna wycena — po pomiarze i ustaleniu zakresu prac.",
    duration: "od 4 do 8 tygodni w zależności od metrażu i liczby korekt",
    includes: [
      "Rysunki inwentaryzacyjne i analiza układu pomieszczeń",
      "1–2 warianty rozwiązania funkcjonalnego",
      "Dobór stylistyki, palety kolorów i inspiracji",
      "Wizualizacje 3D wszystkich pomieszczeń",
      "Dokumentacja wykonawcza dla ekipy remontowej",
      "Specyfikacja mebli, oświetlenia i materiałów wykończeniowych",
    ],
    notIncluded: [
      "Zakup mebli i materiałów",
      "Prace budowlano-remontowe",
      "Nadzór autorski ponad podstawową liczbę wizyt (rozliczany osobno)",
    ],
    goodToKnow: [
      "Liczba korekt koncepcji i wizualizacji jest ustalana w umowie przed rozpoczęciem prac.",
      "Przy zmianie układu ścian nośnych dodatkowo wymagane jest uzgodnienie z konstruktorem — podpowiemy, do kogo się zwrócić.",
      "Pakiet można zamówić częściowo, np. samą koncepcję i wizualizacje 3D bez dokumentacji wykonawczej.",
    ],
  },
  {
    slug: "projekt-domu-jednorodzinnego",
    title: "Projekt domu jednorodzinnego",
    shortDescription:
      "Kompleksowy projekt wnętrz domu — od rozwiązania funkcjonalnego po finalny dekor każdego pomieszczenia.",
    metaDescription:
      "Projekt wnętrza domu jednorodzinnego: układ funkcjonalny pięter, wizualizacje 3D, dokumentacja wykonawcza, dobór wykończenia. Orientacyjna wycena od 160 zł/m².",
    priceFrom: "od 160 zł/m²",
    priceNote:
      "Cena za m² powierzchni całkowitej domu. Przy nietypowej bryle lub skomplikowanym układzie dachu wycena ustalana jest indywidualnie.",
    duration: "od 6 do 12 tygodni w zależności od liczby kondygnacji i metrażu",
    includes: [
      "Analiza projektu architektonicznego i instalacji",
      "Rozwiązanie funkcjonalne każdej kondygnacji",
      "Koncepcja stylistyczna spójna z bryłą budynku",
      "Wizualizacje 3D kluczowych pomieszczeń",
      "Dokumentacja wykonawcza instalacji, oświetlenia i wykończenia",
      "Dobór finalnego dekoru i tekstyliów",
    ],
    notIncluded: [
      "Projekt konstrukcji i instalacji technicznych (wykonują projektanci branżowi)",
      "Prace budowlane i wykończeniowe",
      "Projekt zagospodarowania działki",
    ],
    goodToKnow: [
      "Przy domach w trakcie budowy warto włączyć projektanta wnętrz już na etapie projektu architektonicznego — oszczędza to budżet na późniejsze przeróbki.",
      "Możliwa płatność etapowa za zakończone części projektu.",
      "Nadzór autorski dla obiektów podmiejskich wyceniany jest z uwzględnieniem odległości dojazdu.",
    ],
  },
  {
    slug: "projekt-lokalu-komercyjnego",
    title: "Projekt lokalu komercyjnego",
    shortDescription:
      "Projekt wnętrza dla biura, showroomu, kawiarni lub kliniki z uwzględnieniem wymagań funkcjonalnych i formalnych.",
    metaDescription:
      "Projekt wnętrza lokalu komercyjnego: biuro, showroom, kawiarnia, klinika. Strefowanie, wizualizacje 3D, dokumentacja wykonawcza. Wycena indywidualna.",
    priceFrom: "od 220 zł/m²",
    priceNote:
      "Cena zależy od typu lokalu i wymagań instalacyjnych (wentylacja, urządzenia specjalistyczne). Dokładna wycena — po briefie i wizji lokalnej.",
    duration: "od 5 do 10 tygodni w zależności od metrażu i złożoności zadania",
    includes: [
      "Analiza założeń funkcjonalnych i ruchu klientów/personelu",
      "Strefowanie funkcjonalne lokalu",
      "Koncepcja wnętrza spójna z charakterem działalności (bez opracowania samej identyfikacji marki)",
      "Wizualizacje 3D sali sprzedaży / stref roboczych",
      "Dokumentacja wykonawcza uwzględniająca wymagania przeciwpożarowe i sanitarne",
      "Specyfikacja materiałów odpornych na intensywne użytkowanie",
    ],
    notIncluded: [
      "Opracowanie identyfikacji wizualnej i szyldów",
      "Formalne uzgodnienia projektu w urzędach (wspieramy doradczo)",
      "Dostawa i montaż wyposażenia specjalistycznego (gastronomicznego, medycznego itd.)",
    ],
    goodToKnow: [
      "Dla lokali gastronomicznych i gabinetów medycznych wymagania sanitarne uwzględniamy już na etapie koncepcji.",
      "Termin ustalany jest indywidualnie po briefie — obiekty komercyjne często mają napięty harmonogram otwarcia.",
      "Możliwe zamówienie samej koncepcji 3D do prezentacji inwestorowi lub wynajmującemu.",
    ],
  },
  {
    slug: "projekt-pojedynczego-pomieszczenia",
    title: "Projekt pojedynczego pomieszczenia",
    shortDescription:
      "Punktowy projekt kuchni, łazienki, sypialni lub pokoju dziecięcego — bez ingerencji w resztę mieszkania.",
    metaDescription:
      "Projekt pojedynczego pomieszczenia: kuchnia, łazienka, sypialnia, pokój dziecięcy. Wizualizacja 3D i dokumentacja wykonawcza. Orientacyjna wycena od 3500 zł.",
    priceFrom: "od 3 500 zł za pomieszczenie",
    priceNote:
      "Cena dotyczy jednego pomieszczenia o powierzchni do 12 m². Dla większej powierzchni wycena jest przeliczana — podamy po pomiarze.",
    duration: "od 1,5 do 3 tygodni na pomieszczenie",
    includes: [
      "Pomiar pomieszczenia i lokalizacja instalacji",
      "Rozwiązanie funkcjonalne z rozstawieniem armatury/mebli",
      "Wizualizacja 3D pomieszczenia (1–2 ujęcia)",
      "Dokumentacja wykonawcza: układ płytek, plan elektryki i hydrauliki",
      "Dobór materiałów wykończeniowych",
    ],
    notIncluded: [
      "Projekt sąsiednich pomieszczeń",
      "Zakup i montaż armatury oraz mebli",
      "Nadzór autorski (dostępny jako osobna opcja)",
    ],
    goodToKnow: [
      "Najczęstsze zamówienie to projekt kuchni lub łazienki jako osobne zlecenie przy częściowym remoncie mieszkania.",
      "Przy pokoju dziecięcym dodatkowo uwzględniamy możliwość adaptacji przestrzeni wraz z wiekiem dziecka.",
      "Kilka pomieszczeń zamówione jednocześnie mogą być wycenione z rabatem za zakres — podamy przy wycenie.",
    ],
  },
  {
    slug: "wizualizacje-3d-i-konsultacja",
    title: "Wizualizacje 3D i konsultacja projektanta",
    shortDescription:
      "Bez pełnego projektu: moodboard, dobór palety kolorów, planowanie stref i rekomendacje materiałowe.",
    metaDescription:
      "Wizualizacja 3D i konsultacja projektanta wnętrz: moodboard, dobór palety, planowanie stref, rekomendacje materiałowe. Wycena od 250 zł/godz.",
    priceFrom: "od 250 zł/godz. konsultacji · od 900 zł/pomieszczenie za wizualizację 3D",
    priceNote:
      "Format i cena zależą od zakresu: jednorazowa konsultacja online, konsultacja z wizytą na miejscu lub koncepcja 3D bez dokumentacji wykonawczej.",
    duration: "konsultacja — 1–2 godz., koncepcja 3D — do 5 dni roboczych",
    includes: [
      "Omówienie potrzeb, budżetu i preferencji",
      "Moodboard z inspiracjami stylistycznymi",
      "Rekomendacje dotyczące planowania stref i rozstawienia mebli",
      "Dobór palety kolorów i podstawowych grup materiałów",
      "Opcjonalnie: 1 wariant wizualizacji 3D pomieszczenia",
    ],
    notIncluded: [
      "Dokumentacja wykonawcza dla ekipy remontowej",
      "Szczegółowa specyfikacja materiałów z numerami katalogowymi",
      "Nadzór autorski",
    ],
    goodToKnow: [
      "Dobre rozwiązanie, jeśli remont planujesz zrobić samodzielnie, ale potrzebujesz profesjonalnego punktu odniesienia co do stylu i układu.",
      "Konsultację można przeprowadzić online lub stacjonarnie na obiekcie (w obrębie obsługiwanego regionu).",
      "Po konsultacji można dokupić pełny pakiet projektowy z rabatem za już wykonaną pracę.",
    ],
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}
