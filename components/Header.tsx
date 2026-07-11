import Link from "next/link";
import { contact } from "@/lib/contact";

const navLinks = [
  { href: "/#uslugi", label: "Usługi" },
  { href: "/o-pracowni", label: "O pracowni" },
  { href: "/#proces", label: "Proces" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" aria-label="Strona główna" className="brand-slot" />
        <nav aria-label="Nawigacja główna">
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
