import Link from "next/link";
import { contact } from "@/lib/contact";

const navLinks = [
  { href: "/#poslugy", label: "Послуги" },
  { href: "/pro-studiyu", label: "Про студію" },
  { href: "/#protses", label: "Процес" },
  { href: "/kontakty", label: "Контакти" },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" aria-label="На головну" className="brand-slot">
          [НАЗВА СТУДІЇ]
        </Link>
        <nav aria-label="Головна навігація">
          <ul className="site-nav">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-cta">
          <a href={contact.phoneHref} className="btn btn--outline">
            {contact.phoneDisplay}
          </a>
        </div>
      </div>
    </header>
  );
}
