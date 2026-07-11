# Projektowanie wnętrz — strona pracowni

Strona SSR (Next.js App Router) pracowni projektowania wnętrz z pięcioma rodzajami usług. Po polsku, bez zależności od CDN — wszystkie zasoby (style, ikony, obrazy SVG) są serwowane lokalnie.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja domyślnie działa pod adresem [http://localhost:3000](http://localhost:3000).

## Build produkcyjny

```bash
npm run build
npm run start
```

## Struktura

- `app/page.tsx` — strona główna (landing pod kampanie Google Ads)
- `app/uslugi/[slug]` — podstrony pięciu usług (SSR + `generateStaticParams`)
- `app/o-pracowni`, `app/kontakt`, `app/polityka-prywatnosci`, `app/polityka-cookies` — strony informacyjne
- `app/icon.svg`, `app/apple-icon.svg` — favicon (Next.js file-convention)
- `components/CookieConsent.tsx` — baner zgody na cookies (przyciski: akceptuj / odrzuć / ustawienia)
- `lib/services.ts` — dane pięciu usług oraz etapów pracy
- `lib/contact.ts` — jedno źródło danych kontaktowych (telefon, e-mail, region, dane firmy)
- `proxy.ts` — generuje nonce i nagłówek CSP na każde żądanie (Next.js 16 "proxy", dawniej middleware)
- `next.config.ts` — pozostałe nagłówki bezpieczeństwa (HSTS, X-Frame-Options i inne)

## Uwagi

- Domena-placeholder: `pracownia-wnetrz.example` (ustawiona w `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`) — zamienić na docelową domenę przed wdrożeniem.
- Brak nazwy pracowni i logo celowo — miejsce w nagłówku pozostaje puste, bez tekstowego placeholdera; w stopce i danych firmy widnieje wyłącznie opisowa fraza „Pracownia projektowania wnętrz" oraz realistyczne dane (NIP, REGON, adres, telefon).
- Żadnych nazw marek mebli/armatury/materiałów w treści — tylko typy materiałów i style.
- Brak Google Analytics, pikseli reklamowych i skryptów firm trzecich — zgodnie z opisem w polityce cookies.
- Ceny przy każdej usłudze — orientacyjne widełki z zastrzeżeniem, że ostateczna wycena ustalana jest po pomiarze.
- CSP wykorzystuje nonce generowany w `proxy.ts` (bez `unsafe-inline` dla skryptów), dlatego strony renderowane są dynamicznie (SSR) zamiast w pełni statycznie.
- Gotowa do wdrożenia na Vercel bez dodatkowej konfiguracji.
