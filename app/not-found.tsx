import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section container" style={{ textAlign: "center" }}>
      <h1>Nie znaleziono strony</h1>
      <p>Strona, której szukasz, nie istnieje lub została przeniesiona.</p>
      <Link href="/" className="btn btn--primary">
        Wróć na stronę główną
      </Link>
    </div>
  );
}
