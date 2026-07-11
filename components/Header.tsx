import Link from "next/link";

const navLinks = [
  { href: "/#wycieczki", label: "Wycieczki" },
  { href: "/#dlaczego-my", label: "Dlaczego my" },
  { href: "/#faq", label: "FAQ" },
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
          <a href="tel:+48221234567" className="btn btn--outline">
            +48 22 123 45 67
          </a>
        </div>
      </div>
    </header>
  );
}
