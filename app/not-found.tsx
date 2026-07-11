import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section container" style={{ textAlign: "center" }}>
      <h1>Сторінку не знайдено</h1>
      <p>Сторінка, яку ви шукаєте, не існує або була переміщена.</p>
      <Link href="/" className="btn btn--primary">
        На головну
      </Link>
    </div>
  );
}
