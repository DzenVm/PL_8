import type { Metadata } from "next";
import Link from "next/link";
import { contact } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Контакти студії дизайну інтер'єру: телефон, e-mail, регіон обслуговування та реквізити.",
  alternates: { canonical: "/kontakty" },
};

export default function ContactPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/">Головна</Link> / Контакти
          </p>
          <h1>Контакти</h1>
          <p className="lead">
            Зателефонуйте або напишіть — уточнимо площу, запит і терміни, і
            запропонуємо формат співпраці.
          </p>
        </div>
      </div>

      <div className="section">
        <div className="container detail-grid">
          <div className="prose">
            <h2>Контактні дані</h2>
            <p>
              <strong>Телефон:</strong>{" "}
              <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
              <br />
              <strong>E-mail:</strong>{" "}
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              <br />
              <strong>Графік роботи:</strong> {contact.hours}
            </p>

            <h2>Регіон обслуговування</h2>
            <p>{contact.region}</p>

            <h2>Як відбувається перший контакт</h2>
            <p>
              При зверненні уточнюємо площу приміщення, тип запиту (повний
              проєкт, окрема кімната чи консультація) та орієнтовні терміни.
              На основі цього пропонуємо формат співпраці та орієнтовну
              вартість із відповідної сторінки послуги — точний розрахунок
              надається після заміру.
            </p>

            <h2>Реквізити</h2>
            <p>
              {contact.legalName}
              <br />
              {contact.edrpou}
            </p>
          </div>

          <aside className="info-card">
            <span className="eyebrow">Швидкий контакт</span>
            <p style={{ marginTop: "16px" }}>
              Найшвидше відповідаємо на дзвінки у робочі години.
            </p>
            <a
              href={contact.phoneHref}
              className="btn btn--primary"
              style={{ width: "100%", marginBottom: "12px" }}
            >
              Зателефонувати
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="btn btn--outline"
              style={{ width: "100%" }}
            >
              Написати e-mail
            </a>
          </aside>
        </div>
      </div>
    </>
  );
}
