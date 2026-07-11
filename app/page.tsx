import Link from "next/link";
import Image from "next/image";
import { tours } from "@/lib/tours";
import TourCard from "@/components/TourCard";
import { testimonials } from "@/lib/testimonials";
import { contact } from "@/lib/contact";

const usps = [
  {
    title: "Licencjonowani przewodnicy",
    description:
      "Każdą wycieczkę prowadzi przewodnik miejski z uprawnieniami i wieloletnim doświadczeniem.",
  },
  {
    title: "Małe grupy",
    description:
      "Maksymalnie 12–20 osób w grupie, dzięki czemu każdy uczestnik ma dobry kontakt z przewodnikiem.",
  },
  {
    title: "Elastyczne terminy",
    description:
      "Wycieczki odbywają się codziennie, a dla grup zorganizowanych ustalamy indywidualne godziny.",
  },
  {
    title: "Bez ukrytych kosztów",
    description:
      "Cena podana przy wycieczce zawiera usługę przewodnika — dodatkowe bilety wskazujemy jasno z góry.",
  },
];

const steps = [
  {
    title: "Wybierz trasę",
    description:
      "Przejrzyj pięć wycieczek i wybierz tę, która najlepiej odpowiada Twoim zainteresowaniom i czasowi pobytu w Warszawie.",
  },
  {
    title: "Skontaktuj się z nami",
    description:
      "Zadzwoń, napisz SMS/WhatsApp lub e-mail, podając liczbę osób i preferowany termin. Odpowiadamy zwykle tego samego dnia roboczego.",
  },
  {
    title: "Potwierdzenie terminu",
    description:
      "Potwierdzamy dostępność, miejsce i godzinę zbiórki. Płatność ustalamy indywidualnie — gotówką lub przelewem przed wycieczką.",
  },
  {
    title: "Spotykamy się na trasie",
    description:
      "Przewodnik czeka w umówionym miejscu i prowadzi grupę przez całą trasę, dbając o tempo dostosowane do uczestników.",
  },
];

const faqs = [
  {
    question: "Jak zarezerwować wycieczkę?",
    answer: `Zadzwoń pod numer ${contact.phoneDisplay}, napisz SMS/WhatsApp na ${contact.mobileDisplay} lub e-mail na adres ${contact.email}, podając wybraną trasę, liczbę osób i preferowany termin. Potwierdzimy dostępność w ciągu 24 godzin roboczych.`,
  },
  {
    question: "Czy wycieczki odbywają się w każdą pogodę?",
    answer:
      "Tak, trasy piesze odbywają się niezależnie od warunków atmosferycznych. W przypadku ekstremalnej pogody skontaktujemy się w sprawie zmiany terminu.",
  },
  {
    question: "Czy mogę zamówić wycieczkę w innym języku niż polski?",
    answer:
      "Obecnie wszystkie wycieczki prowadzone są w języku polskim. Przy większych grupach zorganizowanych możliwe jest ustalenie indywidualnych warunków — zapytaj telefonicznie.",
  },
  {
    question: "Czy wycieczka jest odpowiednia dla dzieci?",
    answer:
      "Większość tras jest przyjazna dla rodzin z dziećmi. Wyjątkiem jest wycieczka poświęcona Powstaniu Warszawskiemu, ze względu na trudną tematykę historyczną.",
  },
  {
    question: "Czy w cenę wliczone są bilety wstępu?",
    answer:
      "Zależy od trasy — szczegóły znajdziesz w sekcji „Co zawiera cena” na stronie każdej wycieczki. Część tras obejmuje bilety wstępu, część nie.",
  },
  {
    question: "Ile osób może wziąć udział w jednej wycieczce?",
    answer:
      "W zależności od trasy grupa liczy od 12 do 20 osób. Przy większej liczbie chętnych organizujemy dodatkowy termin lub drugiego przewodnika.",
  },
  {
    question: "Czy można połączyć kilka wycieczek w jeden dzień?",
    answer:
      "Tak, wiele osób łączy np. Stare Miasto z Łazienkami tego samego dnia. Zapytaj przy rezerwacji, a zaproponujemy dogodny plan zwiedzania.",
  },
  {
    question: "Jak wygląda płatność?",
    answer:
      "Płatność ustalamy indywidualnie przy potwierdzeniu rezerwacji — gotówką w dniu wycieczki lub przelewem na wskazany numer konta.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero__bg">
          <Image
            src="/images/warszawa-panorama.svg"
            alt=""
            width={1600}
            height={700}
            priority
            unoptimized
          />
        </div>
        <div className="hero__scrim" />
        <div className="container hero__content">
          <span className="eyebrow">Wycieczki piesze po Warszawie</span>
          <h1>Poznaj Warszawę z lokalnym przewodnikiem</h1>
          <p className="lead">
            Pięć tras spacerowych po najważniejszych miejscach stolicy — od
            odbudowanej starówki, przez historię Powstania Warszawskiego, po
            królewskie ogrody w Łazienkach i Wilanowie. Grupy do 20 osób,
            terminy przez cały tydzień.
          </p>
          <div className="hero__actions">
            <Link href="#wycieczki" className="btn btn--primary">
              Zobacz wycieczki
            </Link>
            <a href={contact.phoneHref} className="btn btn--outline">
              Zadzwoń: {contact.phoneDisplay}
            </a>
          </div>
          <div className="hero__badges">
            <div className="hero__badge">
              <strong>5</strong>
              tras spacerowych
            </div>
            <div className="hero__badge">
              <strong>2–3 godz.</strong>
              średni czas trwania
            </div>
            <div className="hero__badge">
              <strong>do 20 os.</strong>
              wielkość grupy
            </div>
            <div className="hero__badge">
              <strong>11 lat</strong>
              doświadczenia w oprowadzaniu
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="wycieczki">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Nasza oferta</span>
            <h2>Pięć wycieczek po Warszawie do wyboru</h2>
            <p>
              Każda trasa prowadzona jest przez licencjonowanego przewodnika
              miejskiego. Wybierz temat, który Cię interesuje, lub zapytaj o
              połączenie kilku tras w jeden dzień zwiedzania.
            </p>
          </div>
          <div className="tour-grid">
            {tours.map((tour) => (
              <TourCard key={tour.slug} tour={tour} />
            ))}
          </div>
        </div>
      </section>

      <div className="ornament">
        <Image
          src="/images/ozdoba-lisc.svg"
          alt=""
          width={120}
          height={36}
          unoptimized
        />
      </div>

      <section className="section section--alt" id="dlaczego-my">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Dlaczego my</span>
            <h2>Zwiedzanie prowadzone z dbałością o szczegóły</h2>
          </div>
          <div className="usp-grid">
            {usps.map((usp, index) => (
              <div className="usp-item" key={usp.title}>
                <span className="usp-item__num">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{usp.title}</h3>
                <p>{usp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">O nas</span>
            <h2>Warszawa opowiedziana przez ludzi, którzy ją znają</h2>
          </div>
          <div className="about-grid">
            <p>
              Od 2015 roku oprowadzamy mieszkańców Polski i turystów
              zagranicznych po Warszawie — od odbudowanej starówki, przez
              miejsca związane z Powstaniem Warszawskim, po królewskie
              rezydencje w Łazienkach i Wilanowie. Współpracujemy wyłącznie z
              licencjonowanymi przewodnikami miejskimi, którzy łączą wiedzę
              historyczną z umiejętnością ciekawego opowiadania.
            </p>
            <p>
              Stawiamy na małe grupy i kontakt z uczestnikami — zamiast
              wyuczonej formułki, każda wycieczka jest żywą rozmową o mieście,
              jego historii i codziennym życiu mieszkańców. Rocznie
              oprowadzamy kilka tysięcy osób: rodziny, pary, grupy szkolne i
              zespoły firmowe.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Jak to działa</span>
            <h2>Rezerwacja w czterech krokach</h2>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div className="step-item" key={step.title}>
                <span className="step-item__num">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="opinie">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Opinie uczestników</span>
            <h2>Co mówią osoby, które były z nami na trasie</h2>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <figure className="testimonial-card" key={testimonial.name}>
                <div className="testimonial-card__stars" aria-hidden="true">
                  {"★".repeat(testimonial.rating)}
                  {"☆".repeat(5 - testimonial.rating)}
                </div>
                <blockquote>&bdquo;{testimonial.quote}&ldquo;</blockquote>
                <figcaption>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.tour}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt" id="faq">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Najczęstsze pytania</span>
            <h2>Dobrze wiedzieć przed rezerwacją</h2>
          </div>
          <div className="faq">
            {faqs.map((faq) => (
              <details className="faq-item" key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>Umów termin wycieczki po Warszawie</h2>
          <p>
            Napisz lub zadzwoń — pomożemy dobrać trasę odpowiednią dla Twojej
            grupy i ustalić dogodny termin.
          </p>
          <div className="hero__actions" style={{ justifyContent: "center" }}>
            <a href={contact.phoneHref} className="btn btn--primary">
              Zadzwoń: {contact.phoneDisplay}
            </a>
            <Link href="/kontakt" className="btn btn--outline" style={{ borderColor: "#fff", color: "#fff" }}>
              Przejdź do kontaktu
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
