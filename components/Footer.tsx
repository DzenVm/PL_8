import Link from "next/link";
import { tours } from "@/lib/tours";
import { contact } from "@/lib/contact";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>Wycieczki</h4>
            <ul>
              {tours.map((tour) => (
                <li key={tour.slug}>
                  <Link href={`/wycieczki/${tour.slug}`}>{tour.title}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Informacje</h4>
            <ul>
              <li>
                <Link href="/kontakt">Kontakt</Link>
              </li>
              <li>
                <Link href="/regulamin">Regulamin</Link>
              </li>
              <li>
                <Link href="/polityka-prywatnosci">Polityka prywatności</Link>
              </li>
              <li>
                <Link href="/polityka-cookies">Polityka cookies</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Kontakt</h4>
            <ul>
              <li>
                {contact.street}, {contact.postalCode} {contact.city}
              </li>
              <li>
                <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
              </li>
              <li>
                <a href={contact.mobileHref}>{contact.mobileDisplay}</a> (SMS/WhatsApp)
              </li>
              <li>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
              <li>{contact.hours}</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} Wycieczki po Warszawie. Wszelkie prawa zastrzeżone.</span>
          <span className="footer-note">
            Ceny mają charakter orientacyjny i mogą różnić się w zależności od
            terminu oraz wielkości grupy. Organizator wycieczek pieszych po
            Warszawie działający na podstawie obowiązujących przepisów prawa
            polskiego. NIP {contact.nip}, REGON {contact.regon}.
          </span>
        </div>
      </div>
    </footer>
  );
}
