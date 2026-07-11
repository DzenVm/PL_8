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
    // localStorage недоступний (напр. приватний режим) – банер з'явиться знову при наступному візиті
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
      aria-label="Налаштування файлів cookie"
    >
      <div className="cookie-banner__inner">
        <p>
          Сайт не використовує аналітичні або рекламні cookies третіх сторін.
          Ми зберігаємо лише технічний запис у локальній пам&apos;яті браузера,
          щоб запам&apos;ятати ваш вибір щодо цього банера. Детальніше — у{" "}
          <a href="/polityka-cookies">політиці cookies</a>.
        </p>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setShowSettings((prev) => !prev)}
          >
            Налаштування
          </button>
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => saveConsent("rejected")}
          >
            Відхилити необов&apos;язкові
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => saveConsent("accepted")}
          >
            Прийняти всі
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="cookie-settings">
          <label>
            <input type="checkbox" checked disabled />
            <span>
              <strong>Необхідні</strong> — потрібні для роботи сайту
              (напр. запам&apos;ятовування вашого рішення щодо cookies). Їх не
              можна вимкнути.
            </span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={functionalEnabled}
              onChange={(event) => setFunctionalEnabled(event.target.checked)}
            />
            <span>
              <strong>Функціональні</strong> — запам&apos;ятовують додаткові
              налаштування перегляду (напр. розгорнуті розділи FAQ). Можна
              вимкнути без впливу на основну роботу сайту.
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
              Зберегти налаштування
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
