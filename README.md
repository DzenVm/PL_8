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
- `app/wycieczki/[slug]` — statycznie generowane podstrony pięciu wycieczek
- `app/kontakt`, `app/regulamin`, `app/polityka-prywatnosci`, `app/polityka-cookies` — strony informacyjne
- `components/CookieConsent.tsx` — baner zgody na cookies (przyciski: akceptuj / odrzuć / ustawienia)
- `lib/tours.ts` — dane pięciu wycieczek
- `next.config.ts` — nagłówki bezpieczeństwa (CSP, HSTS, X-Frame-Options i inne)

## Uwagi

- Brak logo/marki celowo — miejsce na logo w nagłówku pozostaje puste.
- Brak Google Analytics, pikseli reklamowych i skryptów firm trzecich — zgodnie z opisem w polityce cookies.
- Gotowe do wdrożenia na Vercel bez dodatkowej konfiguracji.
