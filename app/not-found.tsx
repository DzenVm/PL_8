import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section container" style={{ textAlign: "center" }}>
      <h1>Strony nie znaleziono</h1>
      <p>Strona, której szukasz, nie istnieje lub została przeniesiona.</p>
      <Link href="/" className="btn btn--primary">
        Strona główna
      </Link>
    </div>
  );
}
