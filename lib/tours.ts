export interface Tour {
  slug: string;
  title: string;
  shortDescription: string;
  metaDescription: string;
  duration: string;
  groupSize: string;
  language: string;
  meetingPoint: string;
  price: string;
  highlights: string[];
  itinerary: { time: string; title: string; description: string }[];
  included: string[];
  notIncluded: string[];
  goodToKnow: string[];
}

export const tours: Tour[] = [
  {
    slug: "stare-miasto-trakt-krolewski",
    title: "Stare Miasto i Trakt Królewski",
    shortDescription:
      "Spacer po odbudowanej starówce wpisanej na listę UNESCO oraz reprezentacyjnej trasie łączącej Zamek Królewski z Łazienkami.",
    metaDescription:
      "Piesza wycieczka po Starym Mieście w Warszawie i Trakcie Królewskim. Zamek Królewski, Rynek Starego Miasta, Krakowskie Przedmieście. Grupy do 15 osób.",
    duration: "2 godziny 30 minut",
    groupSize: "do 15 osób",
    language: "polski",
    meetingPoint: "Plac Zamkowy, pod kolumną Zygmunta III Wazy",
    price: "od 79 zł za osobę",
    highlights: [
      "Zamek Królewski i Plac Zamkowy",
      "Rynek Starego Miasta i kamieniczki",
      "Barbakan warszawski",
      "Krakowskie Przedmieście",
      "Historia odbudowy miasta po 1945 roku",
    ],
    itinerary: [
      {
        time: "0:00",
        title: "Plac Zamkowy",
        description:
          "Spotkanie z przewodnikiem, krótkie wprowadzenie do historii Warszawy i zniszczeń wojennych.",
      },
      {
        time: "0:20",
        title: "Rynek Starego Miasta",
        description:
          "Spacer wśród kolorowych kamieniczek, opowieść o odbudowie starówki i wpisie na listę UNESCO.",
      },
      {
        time: "1:00",
        title: "Barbakan i mury obronne",
        description: "Pozostałości średniowiecznych fortyfikacji miejskich.",
      },
      {
        time: "1:30",
        title: "Krakowskie Przedmieście",
        description:
          "Reprezentacyjna ulica, pałace, kościoły i pomniki wybitnych Polaków.",
      },
      {
        time: "2:10",
        title: "Zakończenie",
        description: "Podsumowanie i czas na pytania przy Kolumnie Zygmunta.",
      },
    ],
    included: [
      "Usługa licencjonowanego przewodnika miejskiego",
      "Słuchawki (system audio guide) przy większych grupach",
      "Mapa Starego Miasta",
    ],
    notIncluded: ["Bilety wstępu do muzeów", "Transport", "Wyżywienie"],
    goodToKnow: [
      "Trasa prowadzi głównie po nierównym bruku – zalecane wygodne obuwie.",
      "Wycieczka odbywa się niezależnie od pogody.",
      "Możliwość dostosowania trasy dla osób z ograniczoną mobilnością po wcześniejszym zgłoszeniu.",
    ],
  },
  {
    slug: "muzeum-powstania-warszawskiego",
    title: "Śladami Powstania Warszawskiego",
    shortDescription:
      "Wycieczka historyczna po Woli i Śródmieściu poświęcona wydarzeniom sierpnia i września 1944 roku.",
    metaDescription:
      "Wycieczka historyczna śladami Powstania Warszawskiego 1944. Muzeum Powstania Warszawskiego, Wola, miejsca pamięci. Przewodnik po polsku.",
    duration: "3 godziny",
    groupSize: "do 12 osób",
    language: "polski",
    meetingPoint: "Wejście główne, ul. Grzybowska 79",
    price: "od 89 zł za osobę",
    highlights: [
      "Muzeum Powstania Warszawskiego",
      "Pomnik Gustawa Herlinga-Grudzińskiego",
      "Miejsca pamięci na Woli",
      "Historia batalionów powstańczych",
      "Relacje świadków w formie archiwalnych nagrań",
    ],
    itinerary: [
      {
        time: "0:00",
        title: "Zbiórka przy muzeum",
        description: "Wprowadzenie do genezy Powstania Warszawskiego.",
      },
      {
        time: "0:15",
        title: "Zwiedzanie ekspozycji",
        description:
          "Przejście przez główne sale muzealne z przewodnikiem, w tym replikę kanałów.",
      },
      {
        time: "1:45",
        title: "Mur Pamięci",
        description: "Miejsce upamiętniające poległych powstańców.",
      },
      {
        time: "2:15",
        title: "Spacer po Woli",
        description:
          "Miejsca związane z tragicznymi wydarzeniami sierpnia 1944 roku.",
      },
      {
        time: "2:50",
        title: "Zakończenie trasy",
        description: "Czas na indywidualne pytania i rekomendacje dalszego zwiedzania.",
      },
    ],
    included: [
      "Usługa licencjonowanego przewodnika",
      "Bilet wstępu do Muzeum Powstania Warszawskiego",
    ],
    notIncluded: ["Transport", "Wyżywienie", "Napiwki"],
    goodToKnow: [
      "Ze względu na charakter tematyki wycieczka może nie być odpowiednia dla małych dzieci.",
      "Muzeum jest nieczynne w niektóre dni świąteczne – terminy potwierdzane indywidualnie.",
      "Zalecana wcześniejsza rezerwacja z uwagi na limit miejsc w muzeum.",
    ],
  },
  {
    slug: "lazienki-krolewskie",
    title: "Łazienki Królewskie",
    shortDescription:
      "Spokojny spacer po największym parku Warszawy z Pałacem na Wyspie, amfiteatrem i pomnikiem Chopina.",
    metaDescription:
      "Wycieczka po Łazienkach Królewskich w Warszawie. Pałac na Wyspie, Biały Domek, pomnik Chopina. Spacer z przewodnikiem po polsku.",
    duration: "2 godziny",
    groupSize: "do 20 osób",
    language: "polski",
    meetingPoint: "Brama Główna od al. Ujazdowskich",
    price: "od 69 zł za osobę",
    highlights: [
      "Pałac na Wyspie",
      "Pomnik Fryderyka Chopina",
      "Amfiteatr i Biały Domek",
      "Aleje parkowe i stawy",
      "Historia rezydencji Stanisława Augusta Poniatowskiego",
    ],
    itinerary: [
      {
        time: "0:00",
        title: "Brama Główna",
        description: "Wprowadzenie do historii parku i rodu Poniatowskich.",
      },
      {
        time: "0:25",
        title: "Pomnik Chopina",
        description: "Opowieść o koncertach chopinowskich odbywających się w parku.",
      },
      {
        time: "0:55",
        title: "Pałac na Wyspie",
        description: "Widok na główną rezydencję letnią z zewnątrz.",
      },
      {
        time: "1:30",
        title: "Amfiteatr i Biały Domek",
        description: "Mniej znane zakątki parku i ich historia.",
      },
      {
        time: "1:50",
        title: "Zakończenie",
        description: "Podsumowanie spaceru przy stawie górnym.",
      },
    ],
    included: ["Usługa przewodnika", "Mapa parku"],
    notIncluded: ["Bilety wstępu do wnętrz pałacowych", "Transport"],
    goodToKnow: [
      "W sezonie letnim w niedziele w parku odbywają się bezpłatne koncerty chopinowskie.",
      "Park jest częściowo dostępny dla wózków i osób o ograniczonej mobilności.",
      "Zalecane wygodne obuwie – trasa liczy około 3,5 km.",
    ],
  },
  {
    slug: "praga-alternatywna-warszawa",
    title: "Praga – alternatywna Warszawa",
    shortDescription:
      "Poznaj prawobrzeżną dzielnicę Warszawy, jej przedwojenną zabudowę, podwórka i klimat artystycznych inicjatyw.",
    metaDescription:
      "Wycieczka po Pradze w Warszawie. Przedwojenna zabudowa, podwórka, ulica Ząbkowska. Alternatywna trasa z przewodnikiem po polsku.",
    duration: "2 godziny 30 minut",
    groupSize: "do 15 osób",
    language: "polski",
    meetingPoint: "Bazylika Najświętszego Serca Jezusowego, ul. Kawęczyńska",
    price: "od 75 zł za osobę",
    highlights: [
      "Ulica Ząbkowska i jej historia",
      "Przedwojenne podwórka praskie",
      "Bazar Różyckiego",
      "Sztuka uliczna i murale",
      "Kontrast między lewym a prawym brzegiem Wisły",
    ],
    itinerary: [
      {
        time: "0:00",
        title: "Zbiórka przy bazylice",
        description: "Wprowadzenie do historii Pragi jako odrębnej części miasta.",
      },
      {
        time: "0:30",
        title: "Ulica Ząbkowska",
        description: "Spacer wśród przedwojennej zabudowy i lokalnych kamienic.",
      },
      {
        time: "1:15",
        title: "Bazar Różyckiego",
        description: "Historia najstarszego bazaru na Pradze.",
      },
      {
        time: "1:50",
        title: "Podwórka i murale",
        description: "Nieoczywiste zakątki dzielnicy i sztuka uliczna.",
      },
      {
        time: "2:20",
        title: "Zakończenie",
        description: "Podsumowanie trasy i rekomendacje lokalnych miejsc.",
      },
    ],
    included: ["Usługa przewodnika"],
    notIncluded: ["Transport", "Wyżywienie i napoje"],
    goodToKnow: [
      "Trasa prowadzi przez podwórka, które mogą być nierówne – zalecane wygodne obuwie.",
      "Wycieczka pokazuje mniej turystyczną stronę Warszawy.",
      "Dostępna również wersja wieczorna na życzenie grupy.",
    ],
  },
  {
    slug: "wilanow-palac-i-ogrody",
    title: "Wilanów – Pałac i Ogrody",
    shortDescription:
      "Rezydencja króla Jana III Sobieskiego z barokowymi ogrodami na południu Warszawy.",
    metaDescription:
      "Wycieczka do Pałacu w Wilanowie w Warszawie. Barokowe ogrody, rezydencja Jana III Sobieskiego. Przewodnik po polsku, grupy do 15 osób.",
    duration: "3 godziny",
    groupSize: "do 15 osób",
    language: "polski",
    meetingPoint: "Kasa główna, ul. Stanisława Kostki Potockiego 10/16",
    price: "od 95 zł za osobę",
    highlights: [
      "Wnętrza pałacu z XVII i XVIII wieku",
      "Barokowe ogrody włoskie",
      "Historia króla Jana III Sobieskiego",
      "Park krajobrazowy w stylu angielskim",
      "Świątynia Opatrzności Bożej w pobliżu",
    ],
    itinerary: [
      {
        time: "0:00",
        title: "Kasa główna",
        description: "Wprowadzenie do historii rezydencji i rodu Sobieskich.",
      },
      {
        time: "0:20",
        title: "Wnętrza pałacowe",
        description: "Zwiedzanie reprezentacyjnych komnat z przewodnikiem.",
      },
      {
        time: "1:30",
        title: "Ogrody barokowe",
        description: "Spacer wśród tarasów i geometrycznych kompozycji zieleni.",
      },
      {
        time: "2:20",
        title: "Park angielski",
        description: "Swobodna część założenia parkowego nad rzeką.",
      },
      {
        time: "2:50",
        title: "Zakończenie",
        description: "Podsumowanie i czas wolny na zdjęcia w ogrodach.",
      },
    ],
    included: [
      "Usługa przewodnika",
      "Bilet wstępu do wnętrz pałacowych",
      "Bilet wstępu do ogrodów",
    ],
    notIncluded: ["Transport na miejsce", "Wyżywienie"],
    goodToKnow: [
      "Pałac jest zamknięty dla zwiedzających w poniedziałki – terminy potwierdzane indywidualnie.",
      "Ogrody są dostępne dla wózków dziecięcych i osób o ograniczonej mobilności.",
      "Zalecana rezerwacja z co najmniej 3-dniowym wyprzedzeniem w sezonie letnim.",
    ],
  },
];

export function getTourBySlug(slug: string): Tour | undefined {
  return tours.find((tour) => tour.slug === slug);
}
