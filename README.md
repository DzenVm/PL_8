# Wycieczki po Warszawie

Serwis SSR (Next.js App Router) prezentujący 5 pieszych wycieczek po Warszawie. Treść w języku polskim, bez zależności od CDN — wszystkie zasoby (style, ikony, obrazy SVG) są serwowane lokalnie.

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
- `app/wycieczki/[slug]` — podstrony pięciu wycieczek (SSR + `generateStaticParams`)
- `app/kontakt`, `app/regulamin`, `app/polityka-prywatnosci`, `app/polityka-cookies` — strony informacyjne
- `app/icon.svg`, `app/apple-icon.svg` — favicon (Next.js file-convention)
- `components/CookieConsent.tsx` — baner zgody na cookies (przyciski: akceptuj / odrzuć / ustawienia)
- `lib/tours.ts` — dane pięciu wycieczek
- `lib/contact.ts` — jedno źródło danych kontaktowych (telefon, e-mail, adres, NIP/REGON)
- `proxy.ts` — generuje nonce i nagłówek CSP per-request (Next.js 16 "proxy", dawniej middleware)
- `next.config.ts` — pozostałe nagłówki bezpieczeństwa (HSTS, X-Frame-Options i inne)

## Uwagi

- Domena docelowa: `studiadesi.site` (ustawiona w `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`).
- Brak logo/marki celowo — miejsce na logo w nagłówku pozostaje puste.
- Brak Google Analytics, pikseli reklamowych i skryptów firm trzecich — zgodnie z opisem w polityce cookies.
- CSP używa nonce generowanego w `proxy.ts` (bez `unsafe-inline` dla skryptów), dlatego strony renderowane są dynamicznie (SSR) zamiast w pełni statycznie.
- Gotowe do wdrożenia na Vercel bez dodatkowej konfiguracji.
