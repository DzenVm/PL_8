"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "cookie-consent";
const CONSENT_EVENT = "cookie-consent-change";

type Consent = "accepted" | "rejected";

function subscribe(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Consent | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

function getServerSnapshot(): Consent | null {
  return null;
}

function saveConsent(consent: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, consent);
  } catch {
    // localStorage niedostępny (np. tryb prywatny) – banner pojawi się ponownie przy kolejnej wizycie
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export default function CookieConsent() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [showSettings, setShowSettings] = useState(false);
  const [functionalEnabled, setFunctionalEnabled] = useState(true);

  if (consent !== null) {
    return null;
  }

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-live="polite"
      aria-label="Ustawienia plików cookie"
    >
      <div className="cookie-banner__inner">
        <p>
          Używamy niezbędnych plików cookie oraz lokalnego zapisu przeglądarki,
          aby strona działała poprawnie i zapamiętała Twój wybór dotyczący
          cookies. Nie korzystamy z narzędzi analitycznych ani reklamowych.
          Szczegóły znajdziesz w{" "}
          <a href="/polityka-cookies">polityce cookies</a>.
        </p>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setShowSettings((prev) => !prev)}
          >
            Ustawienia
          </button>
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => saveConsent("rejected")}
          >
            Odrzuć niekonieczne
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => saveConsent("accepted")}
          >
            Akceptuj wszystkie
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="cookie-settings">
          <label>
            <input type="checkbox" checked disabled />
            <span>
              <strong>Niezbędne</strong> – wymagane do działania strony
              (np. zapamiętanie Twojej decyzji dot. cookies). Nie można ich
              wyłączyć.
            </span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={functionalEnabled}
              onChange={(event) => setFunctionalEnabled(event.target.checked)}
            />
            <span>
              <strong>Funkcjonalne</strong> – zapamiętują dodatkowe
              preferencje przeglądania (np. rozwinięte sekcje FAQ). Możesz je
              wyłączyć bez wpływu na podstawowe działanie strony.
            </span>
          </label>
          <div className="cookie-banner__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() =>
                saveConsent(functionalEnabled ? "accepted" : "rejected")
              }
            >
              Zapisz ustawienia
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
