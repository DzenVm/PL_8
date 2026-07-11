import Link from "next/link";
import { services } from "@/lib/services";
import { contact } from "@/lib/contact";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>Usługi</h4>
            <ul>
              {services.map((service) => (
                <li key={service.slug}>
                  <Link href={`/uslugi/${service.slug}`}>{service.title}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Informacje</h4>
            <ul>
              <li>
                <Link href="/o-pracowni">O pracowni</Link>
              </li>
              <li>
                <Link href="/kontakt">Kontakt</Link>
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
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
              <li>{contact.hours}</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} Pracownia projektowania wnętrz. Wszelkie prawa zastrzeżone.</span>
          <span className="footer-note">
            Ceny na stronie mają charakter orientacyjny i są ustalane
            ostatecznie po pomiarze oraz uzgodnieniu zakresu prac.
            Jednoosobowa działalność gospodarcza, NIP {contact.nip}, REGON{" "}
            {contact.regon}.
          </span>
        </div>
      </div>
    </footer>
  );
}
