"use client";
import * as React from "react";
import { messages, type Locale, type Messages } from "./messages";

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Messages;
}

const defaultCtx: I18nCtx = { locale: "en", setLocale: () => {}, t: messages.en };

const I18nContext = React.createContext<I18nCtx>(defaultCtx);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  React.useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored === "en" || stored === "de") {
      setLocaleState(stored);
    } else if (navigator.language.toLowerCase().startsWith("de")) {
      setLocaleState("de");
    }
  }, []);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }, []);

  const value = React.useMemo(
    () => ({ locale, setLocale, t: messages[locale] }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): I18nCtx {
  return React.useContext(I18nContext);
}

export function formatFloor(floor: number | null, floors: Messages["floors"]): string {
  if (floor === null) return floors.unassigned;
  if (floor === 0) return floors.ground;
  if (floor < 0) return floors.basement.replace("{{n}}", String(Math.abs(floor)));
  return floors.floor.replace("{{n}}", String(floor));
}

export function localizeAmenity(
  slug: string,
  amenities: Messages["amenities"]
): string {
  return (amenities as Record<string, string>)[slug] ?? slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
