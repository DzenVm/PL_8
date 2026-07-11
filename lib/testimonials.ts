export interface Testimonial {
  name: string;
  tour: string;
  rating: number;
  quote: string;
}

export const testimonials: Testimonial[] = [
  {
    name: "Anna K., Kraków",
    tour: "Stare Miasto i Trakt Królewski",
    rating: 5,
    quote:
      "Przewodnik znał mnóstwo ciekawostek, o których nie przeczyta się w przewodniku. Dwie i pół godziny minęły bardzo szybko, polecam całej rodzinie.",
  },
  {
    name: "Marek W., Wrocław",
    tour: "Śladami Powstania Warszawskiego",
    rating: 5,
    quote:
      "Bardzo emocjonalna i rzetelnie poprowadzona wycieczka. Widać było przygotowanie przewodnika i szacunek do tematu.",
  },
  {
    name: "Katarzyna i Tomasz, Poznań",
    tour: "Wilanów – Pałac i Ogrody",
    rating: 5,
    quote:
      "Byliśmy umówieni na konkretną godzinę i wszystko odbyło się punktualnie. Ogrody zrobiły na nas ogromne wrażenie, a przewodnik chętnie odpowiadał na pytania dzieci.",
  },
  {
    name: "Grupa firmowa, Warszawa",
    tour: "Praga – alternatywna Warszawa",
    rating: 4,
    quote:
      "Zorganizowaliśmy wycieczkę integracyjną dla 18 osób z biura. Sprawna komunikacja przy rezerwacji i ciekawa trasa poza utartym szlakiem turystycznym.",
  },
];
