import Link from "next/link";
import Image from "next/image";
import { services, stages } from "@/lib/services";
import { contact } from "@/lib/contact";

const principles = [
  {
    title: "Przejrzysty budżet",
    description:
      "Przy każdej usłudze — orientacyjna wycena i dokładnie to, co się w niej zawiera. Ostateczna cena — dopiero po pomiarze.",
  },
  {
    title: "Bez gotowych szablonów",
    description:
      "Koncepcja jest projektowana pod konkretne pomieszczenie, przyzwyczajenia domowników i budżet, a nie dopasowywana do typowego projektu.",
  },
  {
    title: "Kontrola na każdym etapie",
    description:
      "Układ funkcjonalny, wizualizacje 3D i dokumentację wykonawczą widzisz jeszcze przed rozpoczęciem remontu — bez niespodzianek w trakcie prac.",
  },
  {
    title: "Wsparcie do samego końca",
    description:
      "Nadzór autorski oznacza, że projektant sprawdza zgodność realizacji z projektem, a nie znika po przekazaniu rysunków.",
  },
];

const faqs = [
  {
    question: "Ile kosztuje projekt wnętrza?",
    answer:
      "Zależy od rodzaju usługi i metrażu — orientacyjne widełki cenowe są podane na stronie każdej usługi. Dokładną wycenę podajemy po pomiarze pomieszczenia i uzgodnieniu zakresu prac.",
  },
  {
    question: "Co obejmuje pierwszy, bezpłatny kontakt?",
    answer:
      "To krótka rozmowa telefoniczna lub mailowa: ustalamy metraż, potrzeby i terminy, a następnie proponujemy formę współpracy (konsultacja, pojedyncze pomieszczenie lub projekt pod klucz). Szczegółowa wycena i dalsze ustalenia odbywają się już w ramach usługi płatnej.",
  },
  {
    question: "Ile trwa opracowanie projektu?",
    answer:
      "Od 1,5 tygodnia dla pojedynczego pomieszczenia do 8–12 tygodni dla domu pod klucz. Orientacyjne terminy są podane na stronie każdej usługi i doprecyzowywane po briefie.",
  },
  {
    question: "Czy można zamówić samą wizualizację 3D bez pełnego projektu?",
    answer:
      "Tak, to osobna usługa — wizualizacja 3D i konsultacja projektanta, bez dokumentacji wykonawczej. Dobre rozwiązanie, jeśli remont planujesz wykonać samodzielnie.",
  },
  {
    question: "Czy zakup mebli i materiałów jest wliczony w cenę projektu?",
    answer:
      "Nie, cena podstawowa obejmuje opracowanie projektu (układ funkcjonalny, 3D, dokumentację). Zakup materiałów i prace remontowe klient organizuje samodzielnie lub z zaangażowanymi wykonawcami — w razie potrzeby możemy polecić sprawdzone ekipy.",
  },
  {
    question: "Na jakim obszarze Państwo działają?",
    answer: `Podstawowy region to ${contact.region}. Dla obiektów poza tym obszarem dojazd i terminy ustalane są indywidualnie.`,
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="eyebrow">Pracownia projektowania wnętrz</span>
            <h1>Projekt wnętrza, który odpowiada za swoją funkcjonalność</h1>
            <p className="lead">
              Pięć rodzajów usług — od pojedynczego pomieszczenia po dom pod
              klucz. Układ funkcjonalny, wizualizacje 3D, dokumentacja
              wykonawcza i nadzór autorski na każdym etapie remontu.
            </p>
            <div className="hero__actions">
              <Link href="#uslugi" className="btn btn--primary">
                Zobacz usługi
              </Link>
              <a href={contact.phoneHref} className="btn btn--outline">
                {contact.phoneDisplay}
              </a>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <strong>5</strong>
                <span>rodzajów usług</span>
              </div>
              <div className="hero__stat">
                <strong>5</strong>
                <span>etapów pracy</span>
              </div>
              <div className="hero__stat">
                <strong>180 zł/m²</strong>
                <span>cena początkowa</span>
              </div>
            </div>
          </div>
          <div className="hero__art">
            <Image
              src="/images/plan-pomieszczenia.svg"
              alt="Abstrakcyjny rysunek liniowy planu pomieszczenia"
              width={520}
              height={620}
              priority
              unoptimized
            />
          </div>
        </div>
      </section>

      <section className="section" id="uslugi">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Usługi</span>
            <h2>Pięć rodzajów projektowania wnętrz</h2>
            <p>
              Każdą usługę można zamówić osobno. Orientacyjna cena i termin —
              na stronie usługi, ostateczna wycena — po pomiarze.
            </p>
          </div>
          <div className="service-list">
            {services.map((service, index) => (
              <Link
                key={service.slug}
                href={`/uslugi/${service.slug}`}
                className="service-row"
              >
                <span className="service-row__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.shortDescription}</p>
                </div>
                <div className="service-row__meta">
                  <strong>{service.priceFrom}</strong>
                  {service.duration}
                </div>
                <span className="service-row__arrow">Szczegóły →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Przejrzystość cen</span>
            <h2>Co oznaczają ceny podane na stronie</h2>
          </div>
          <div className="price-note">
            <span className="price-note__mark" aria-hidden="true">
              zł
            </span>
            <p>
              Wszystkie ceny na stronie to orientacyjne widełki oparte na
              projektach o przeciętnej złożoności. Ostateczna wycena powstaje
              po bezpłatnym pierwszym kontakcie, pomiarze na miejscu i
              uzgodnieniu zakresu prac — przed rozpoczęciem realizacji
              otrzymujesz dokładny kosztorys w umowie, bez ukrytych dopłat za
              etapy nieuzgodnione wcześniej.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--ink" id="proces">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Jak pracujemy</span>
            <h2>Pięć etapów — od pomiaru po nadzór</h2>
            <p>
              Ta sama struktura dla każdej usługi — zmienia się jedynie
              zakres prac na poszczególnych etapach.
            </p>
          </div>
          <div className="process-strip">
            {stages.map((stage, index) => (
              <div className="process-step" key={stage.title}>
                <span className="process-step__num">
                  0{index + 1}
                </span>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <div style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}>
          <Image
            src="/images/linia-wymiarowa.svg"
            alt=""
            width={240}
            height={24}
            unoptimized
          />
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Zasady pracy</span>
            <h2>Dlaczego klienci wybierają takie podejście</h2>
          </div>
          <div className="principles-grid">
            <p className="principles-quote">
              „Projekt ma odpowiadać nie na hasło »zróbcie ładnie«, lecz na
              konkretne pytania: gdzie przechowywać rzeczy, jak oświetlić
              stanowisko pracy, gdzie poprowadzić kanał kablowy”.
            </p>
            <ul className="principles-list">
              {principles.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section section--alt" id="faq">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Najczęstsze pytania</span>
            <h2>Zanim się zgłosisz</h2>
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
        <div className="container cta-band__grid">
          <div>
            <h2>Omówmy Twój projekt</h2>
            <p>
              Zadzwoń lub napisz — ustalimy metraż, potrzeby i terminy, i
              zaproponujemy formę współpracy.
            </p>
          </div>
          <div className="cta-band__actions">
            <a href={contact.phoneHref} className="btn btn--primary">
              {contact.phoneDisplay}
            </a>
            <Link href="/kontakt" className="btn btn--outline-light">
              Kontakt
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
