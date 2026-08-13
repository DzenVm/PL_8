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
- Zwykła strona pozostaje bezpiecznym zachowaniem domyślnym przy błędzie konfiguracji PL_8. Opcjonalna telemetria Server B nie blokuje przekierowania. Awaria zewnętrznego celu po opuszczeniu PL_8 pozostaje osobnym ryzykiem i wymaga monitorowania.

## Server-side routing wejść reklamowych

Routing jest wykonywany wyłącznie w `proxy.ts`; przeglądarka nie pobiera skryptu TDS i nie zna sekretu podpisu.

- mechanizm uruchamia się tylko dla `GET` lub `HEAD` na `/`, gdy URL zawiera jeden poprawny `gclid`, `gbraid` lub `wbraid`;
- same parametry `utm_*` nie uruchamiają routingu;
- cel jest stałym adresem HTTPS z konfiguracji serwera i musi pasować do ścisłej listy dozwolonych hostów;
- do celu są przekazywane tylko dozwolone identyfikatory reklamy i UTM; dowolne `redirect`, `url`, `destination` i przesłane przez klienta `sub_id_6` są ignorowane;
- `sub_id_6` jest zawsze nadpisywany losowym `correlation_id`;
- opcjonalne zdarzenie do Server B jest podpisywane HMAC i wykonywane w tle. Awaria lub timeout zdarzenia nie zatrzymuje przekierowania;
- User-Agent, IP, geolokalizacja, nazwa crawlera i bot-score nie są wejściem do decyzji. Ten sam URL ma ten sam typ odpowiedzi niezależnie od klienta.

Ten etap nie wywołuje Palladium i nie używa jego werdyktu do routingu. Realizuje stałe przekierowanie do skonfigurowanego adresu kampanii Keitaro oraz opcjonalną telemetrię Server B.

Zmienne środowiskowe są opisane w `.env.example`. `TDS_SHARED_SECRET` należy ustawiać wyłącznie jako chronioną zmienną Vercel, bez prefiksu `NEXT_PUBLIC_`.

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
TDS_EVENT_URL=https://events.example/v4/index.php \
TDS_SHARED_SECRET=unique-client-bundle-test-marker \
npm run build
TDS_TARGET_URL=https://tracker.example/campaign \
TDS_EVENT_URL=https://events.example/v4/index.php \
TDS_SHARED_SECRET=unique-client-bundle-test-marker \
npm run test:bundle
```

## Uwagi
- Brak nazwy pracowni i logo celowo — miejsce w nagłówku pozostaje puste, bez tekstowego placeholdera; w stopce i danych firmy widnieje wyłącznie opisowa fraza „Pracownia projektowania wnętrz" oraz realistyczne dane (NIP, REGON, adres, telefon).
- Żadnych nazw marek mebli/armatury/materiałów w treści — tylko typy materiałów i style.
- Brak Google Analytics, pikseli reklamowych i skryptów firm trzecich — zgodnie z opisem w polityce cookies.
- Ceny przy każdej usłudze — orientacyjne widełki z zastrzeżeniem, że ostateczna wycena ustalana jest po pomiarze.
- CSP wykorzystuje nonce generowany w `proxy.ts` (bez `unsafe-inline` dla skryptów), dlatego strony renderowane są dynamicznie (SSR) zamiast w pełni statycznie.
- Gotowa do wdrożenia na Vercel bez dodatkowej konfiguracji.
