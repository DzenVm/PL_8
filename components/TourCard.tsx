import Link from "next/link";
import type { Tour } from "@/lib/tours";

export default function TourCard({ tour }: { tour: Tour }) {
  return (
    <article className="tour-card">
      <div className="tour-card__meta">
        <span>{tour.duration}</span>
        <span>•</span>
        <span>{tour.groupSize}</span>
      </div>
      <h3>
        <Link href={`/wycieczki/${tour.slug}`}>{tour.title}</Link>
      </h3>
      <p>{tour.shortDescription}</p>
      <div className="tour-card__price">
        <strong>{tour.price}</strong>
        <Link href={`/wycieczki/${tour.slug}`} className="link-arrow">
          Zobacz szczegóły →
        </Link>
      </div>
    </article>
  );
}
