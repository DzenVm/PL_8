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
            <h4>Послуги</h4>
            <ul>
              {services.map((service) => (
                <li key={service.slug}>
                  <Link href={`/poslugy/${service.slug}`}>{service.title}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Інформація</h4>
            <ul>
              <li>
                <Link href="/pro-studiyu">Про студію</Link>
              </li>
              <li>
                <Link href="/kontakty">Контакти</Link>
              </li>
              <li>
                <Link href="/polityka-konfidentsiynosti">
                  Політика конфіденційності
                </Link>
              </li>
              <li>
                <Link href="/polityka-cookies">Політика cookies</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Контакти</h4>
            <ul>
              <li>{contact.legalName}</li>
              <li>{contact.region}</li>
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
          <span>© {year} [НАЗВА СТУДІЇ]. Усі права захищені.</span>
          <span className="footer-note">
            Вартість послуг на сайті орієнтовна й уточнюється після заміру та
            узгодження технічного завдання. {contact.legalName}, {contact.edrpou}.
          </span>
        </div>
      </div>
    </footer>
  );
}
