import Link from "next/link";
import Image from "next/image";
import { services, stages } from "@/lib/services";
import { contact } from "@/lib/contact";

const principles = [
  {
    title: "Прозорий бюджет",
    description:
      "На кожен напрямок — орієнтовна вартість і що саме до неї входить. Фінальний прайс — тільки після заміру.",
  },
  {
    title: "Без готових шаблонів",
    description:
      "Концепція будується під конкретне приміщення, звички мешканців і бюджет, а не підганяється під типовий проєкт.",
  },
  {
    title: "Контроль на кожному етапі",
    description:
      "Ви бачите планування, 3D-візуалізацію та робочу документацію до старту ремонту — без сюрпризів по ходу робіт.",
  },
  {
    title: "Супровід до фіналу",
    description:
      "Авторський нагляд означає, що дизайнер перевіряє відповідність ремонту проєкту, а не зникає після здачі креслень.",
  },
];

const faqs = [
  {
    question: "Скільки коштує дизайн-проєкт?",
    answer:
      "Залежить від напрямку та площі — орієнтовні вилки цін вказані на сторінці кожної послуги. Точну вартість озвучуємо після заміру приміщення та узгодження обсягу робіт.",
  },
  {
    question: "Що входить у безкоштовний перший контакт?",
    answer:
      "Це коротка розмова телефоном або на пошті: ми уточнюємо площу, запит і терміни, а тоді пропонуємо формат співпраці (консультація, окреме приміщення чи проєкт під ключ). Розрахунок вартості та деталі — вже в межах платних послуг.",
  },
  {
    question: "Скільки триває розробка проєкту?",
    answer:
      "Від 1,5 тижня для окремого приміщення до 8–12 тижнів для будинку під ключ. Орієнтовні терміни вказані на сторінці кожної послуги та уточнюються після брифу.",
  },
  {
    question: "Чи можна замовити лише 3D-візуалізацію без повного проєкту?",
    answer:
      "Так, це окремий напрямок — 3D-візуалізація та консультація дизайнера, без робочої документації. Підходить, якщо ремонт плануєте робити самостійно.",
  },
  {
    question: "Чи входить закупівля меблів і матеріалів у вартість проєкту?",
    answer:
      "Ні, у базову вартість входить розробка проєкту (планування, 3D, документація). Закупівлю та ремонтні роботи клієнт організовує самостійно або із залученими підрядниками — за потреби можемо порекомендувати перевірених виконавців.",
  },
  {
    question: "У яких регіонах ви працюєте?",
    answer: `Основний регіон — ${contact.region}. Для об'єктів поза межами регіону виїзд і терміни узгоджуються окремо.`,
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="eyebrow">Студія дизайну інтер&apos;єру</span>
            <h1>Дизайн простору, який відповідає за свою функціональність</h1>
            <p className="lead">
              П&apos;ять напрямків послуг — від окремої кімнати до будинку під
              ключ. Планування, 3D-візуалізація, робоча документація та
              авторський нагляд на кожному етапі ремонту.
            </p>
            <div className="hero__actions">
              <Link href="#poslugy" className="btn btn--primary">
                Переглянути послуги
              </Link>
              <a href={contact.phoneHref} className="btn btn--outline">
                {contact.phoneDisplay}
              </a>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <strong>5</strong>
                <span>напрямків послуг</span>
              </div>
              <div className="hero__stat">
                <strong>5</strong>
                <span>етапів роботи</span>
              </div>
              <div className="hero__stat">
                <strong>750 грн/м²</strong>
                <span>стартова вартість</span>
              </div>
            </div>
          </div>
          <div className="hero__art">
            <Image
              src="/images/planuvannya-liniyy.svg"
              alt="Абстрактне лінійне креслення планування приміщення"
              width={520}
              height={620}
              priority
              unoptimized
            />
          </div>
        </div>
      </section>

      <section className="section" id="poslugy">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Послуги</span>
            <h2>П&apos;ять напрямків дизайну інтер&apos;єру</h2>
            <p>
              Кожен напрямок можна замовити окремо. Орієнтовна вартість і
              терміни — на сторінці послуги, фінальний розрахунок — після
              заміру.
            </p>
          </div>
          <div className="service-list">
            {services.map((service, index) => (
              <Link
                key={service.slug}
                href={`/poslugy/${service.slug}`}
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
                <span className="service-row__arrow">Детальніше →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Прозорість цін</span>
            <h2>Що означають ціни на сайті</h2>
          </div>
          <div className="price-note">
            <span className="price-note__mark" aria-hidden="true">
              €
            </span>
            <p>
              Усі ціни на сайті — орієнтовні вилки, засновані на середній
              складності проєктів. Фінальна вартість формується після
              безкоштовного першого контакту, виїзного заміру та узгодження
              технічного завдання — до старту робіт ви отримуєте точний
              прорахунок у договорі, без прихованих доплат за етапи, які не
              обговорювались заздалегідь.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--ink" id="protses">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Як ми працюємо</span>
            <h2>П&apos;ять етапів — від заміру до нагляду</h2>
            <p>
              Однакова структура для будь-якого напрямку послуг — змінюється
              лише обсяг робіт на кожному етапі.
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
            src="/images/liniya-vymiru.svg"
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
            <span className="eyebrow">Принципи роботи</span>
            <h2>Чому клієнти обирають такий підхід</h2>
          </div>
          <div className="principles-grid">
            <p className="principles-quote">
              «Проєкт має відповідати не на запит „зробіть красиво”, а на
              конкретні запитання: де зберігати речі, як освітити робоче
              місце, куди піде кабель-канал».
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
            <span className="eyebrow">Питання, що часто виникають</span>
            <h2>Перед тим як звертатись</h2>
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
            <h2>Обговорити ваш проєкт</h2>
            <p>
              Зателефонуйте або напишіть — уточнимо площу, запит і терміни, і
              запропонуємо формат співпраці.
            </p>
          </div>
          <div className="cta-band__actions">
            <a href={contact.phoneHref} className="btn btn--primary">
              {contact.phoneDisplay}
            </a>
            <Link href="/kontakty" className="btn btn--outline-light">
              Контакти
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
