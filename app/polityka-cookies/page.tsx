import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Політика cookies",
  description:
    "Інформація про файли cookie та локальне сховище браузера, що використовуються на сайті.",
  alternates: { canonical: "/polityka-cookies" },
};

export default function CookiePolicyPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/">Головна</Link> / Політика cookies
          </p>
          <h1>Політика cookies</h1>
        </div>
      </div>

      <div className="section">
        <div className="container prose" style={{ maxWidth: "760px" }}>
          <h2>Що таке файли cookie</h2>
          <p>
            Файли cookie — невеликі текстові файли, що зберігаються у
            браузері пристрою. У випадку цього сайту йдеться також про запис
            у локальній пам&apos;яті браузера (localStorage), який виконує
            подібну функцію.
          </p>

          <h2>Які категорії використовуються</h2>

          <h3>Необхідні (завжди активні)</h3>
          <p>
            Один запис у localStorage, що зберігає інформацію про те, чи
            прийняли або відхилили ви банер cookies. Без цього запису банер
            з&apos;являвся б при кожному візиті. Цей запис не передається
            жодній третій стороні.
          </p>

          <h3>Функціональні (опційні)</h3>
          <p>
            Зарезервована категорія для налаштувань, що покращують зручність
            користування сайтом (напр. запам&apos;ятовування розгорнутих
            розділів FAQ). Можна ввімкнути або вимкнути в налаштуваннях
            банера cookies — вимкнення не обмежує доступ до контенту сайту.
          </p>

          <h3>Аналітичні та рекламні</h3>
          <p>
            <strong>Не використовуються.</strong> Сайт не містить скриптів
            Google Analytics, Google Ads, Meta Pixel чи будь-яких інших
            аналітичних або рекламних інструментів третіх сторін.
          </p>

          <h2>Керування згодою</h2>
          <p>
            Свій вибір можна змінити будь-коли, очистивши дані сайту
            (localStorage) у налаштуваннях браузера — банер cookies
            з&apos;явиться знову при наступному візиті.
          </p>

          <p style={{ fontSize: "0.85rem" }}>Останнє оновлення: липень 2026.</p>
        </div>
      </div>
    </>
  );
}
