import Link from "next/link";
import Image from "next/image";
import { tours } from "@/lib/tours";
import TourCard from "@/components/TourCard";

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

const faqs = [
  {
    question: "Jak zarezerwować wycieczkę?",
    answer:
      "Zadzwoń pod numer +48 22 123 45 67 lub napisz na adres kontakt@wycieczki-warszawa.example, podając wybraną trasę, liczbę osób i preferowany termin. Potwierdzimy dostępność w ciągu 24 godzin roboczych.",
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
            <Link href="/kontakt" className="btn btn--outline">
              Zapytaj o termin
            </Link>
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

      <section className="section" id="faq">
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
          <Link href="/kontakt" className="btn btn--primary">
            Przejdź do kontaktu
          </Link>
        </div>
      </section>
    </>
  );
}
