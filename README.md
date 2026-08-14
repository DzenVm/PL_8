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

## Domena i routing

- Domena produkcyjna sandboxu: `studiadesi.site`. Jedynym źródłem adresu jest `lib/site.ts`.
- Funkcje Vercel są uruchamiane w regionie `fra1` (Frankfurt), bliżej ruchu z Polski i Turcji oraz europejskiego Server B.
- Repozytorium nie zawiera klienta `probe`, publicznych tokenów ani bezpośrednich wywołań `api.studiadesi.site` z przeglądarki.
- Zwykła strona pozostaje bezpiecznym zachowaniem domyślnym przy błędzie konfiguracji PL_8. Routing reklamowy jest włączany dopiero po kompletnej konfiguracji podpisanego endpointu decyzyjnego Server B.

## Server-side routing wejść reklamowych

Routing jest wykonywany wyłącznie w `proxy.ts`; przeglądarka nie pobiera skryptu TDS i nie zna sekretu podpisu.

- mechanizm uruchamia się tylko dla `GET` lub `HEAD` na `/`, gdy URL zawiera jeden poprawny `gclid`, `gbraid` lub `wbraid`;
- same parametry `utm_*` nie uruchamiają routingu;
- Vercel wysyła jeden podpisany request do Server B, a Server B wykonuje synchroniczne server-to-server zapytanie do Palladium;
- `allow` Palladium może zwrócić HTTPS target tylko z dokładnej listy dozwolonych hostów; `deny` pokazuje zwykłą stronę;
- do celu są przekazywane tylko dozwolone identyfikatory reklamy i UTM; dowolne `redirect`, `url`, `destination` i przesłane przez klienta `sub_id_6` są ignorowane;
- `sub_id_6` jest zawsze nadpisywany losowym `correlation_id`;
- request do wspólnego endpointu Server B jest podpisywany kluczem przypisanym wyłącznie do `TDS_SITE_ID=PL_8`; replay, zły podpis i inny `site_id` są odrzucane;
- do Palladium przekazywane są prawdziwy publiczny IP, User-Agent i podstawowe nagłówki żądania. Jeśli Cloudflare ustawi podpisany `X-PL8-CF-Verified`, używany jest jego `CF-Connecting-IP`; bez tego markera PL_8 bezpiecznie korzysta z Vercelowego IP. PL_8 nie podmienia browser fingerprintu i nie zawiera własnej reguły Googlebot/AdsBot;
- `TDS_ERROR_FALLBACK=target` zachowuje płatny ruch przy technicznym timeout/5xx, ale taki awaryjny click omija werdykt Palladium i jest logowany jako błąd. Wartość `site` nigdy nie omija Palladium, lecz pokazuje zwykłą stronę podczas awarii.

Endpoint i sekret Palladium istnieją wyłącznie na Server B. Przeglądarka i bundle Vercel nie otrzymują tych danych. Własne logi Server B nie zapisują surowego IP ani User-Agent, ale te dane są przetwarzane przez Palladium w celu wydania decyzji.

Zmienne środowiskowe są opisane w `.env.example`. `TDS_SHARED_SECRET` należy ustawiać wyłącznie jako chronioną zmienną Vercel, bez prefiksu `NEXT_PUBLIC_`. Wspólny endpoint obsługuje wiele stron, ale każda strona ma własne `TDS_SITE_ID`, `TDS_KEY_ID` i sekret; skopiowanie sekretu między projektami jest zabronione.

Przed włączeniem w production administrator powinien potwierdzić z prawnikiem podstawę prawną, listę odbiorców i faktyczną retencję we wszystkich podłączonych systemach. Własne logi PL_8 zawierają identyfikator korelacyjny, znaczniki czasu, ścieżkę, dozwolone parametry kampanii (UTM, `gad_source`) i skrót HMAC identyfikatora kliknięcia — nigdy surowy identyfikator. Włączenie telemetrii wymaga najpierw sprawdzonego, niezależnego codziennego usuwania rekordów starszych niż 30 dni.

### Kontrola jakości

```bash
npm test
npm run typecheck
npm run lint
npm run test:foundation
TDS_ENABLED=true \
TDS_TARGET_URL=https://tracker.example/campaign \
TDS_ALLOWED_TARGET_HOSTS=tracker.example \
TDS_DECISION_URL=https://events.example/v4/index.php \
TDS_SHARED_SECRET=unique-client-bundle-test-marker \
TDS_KEY_ID=pl8-test-v1 \
TDS_SITE_ID=PL_8 \
npm run build
TDS_TARGET_URL=https://tracker.example/campaign \
TDS_DECISION_URL=https://events.example/v4/index.php \
TDS_SHARED_SECRET=unique-client-bundle-test-marker \
TDS_KEY_ID=pl8-test-v1 \
TDS_SITE_ID=PL_8 \
npm run test:bundle
```

## Uwagi
- Brak nazwy pracowni i logo celowo — miejsce w nagłówku pozostaje puste, bez tekstowego placeholdera; w stopce i danych firmy widnieje wyłącznie opisowa fraza „Pracownia projektowania wnętrz" oraz realistyczne dane (NIP, REGON, adres, telefon).
- Żadnych nazw marek mebli/armatury/materiałów w treści — tylko typy materiałów i style.
- Brak Google Analytics, pikseli reklamowych i skryptów firm trzecich — zgodnie z opisem w polityce cookies.
- Ceny przy każdej usłudze — orientacyjne widełki z zastrzeżeniem, że ostateczna wycena ustalana jest po pomiarze.
- CSP wykorzystuje nonce generowany w `proxy.ts` (bez `unsafe-inline` dla skryptów), dlatego strony renderowane są dynamicznie (SSR) zamiast w pełni statycznie.
- Gotowa do wdrożenia na Vercel bez dodatkowej konfiguracji.
