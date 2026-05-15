"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  getLocaleMeta,
  isLocale,
  LOCALES,
  type Locale,
} from "./locales";
import { DICTIONARIES, type StringKey } from "./strings";
import { CITIES, type CityId } from "../cities";

const STORAGE_KEY = "crimeradar.locale";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  cityName: (id: CityId) => string;
};

const I18nContext = createContext<Ctx | null>(null);

function format(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Hydrate from localStorage AFTER mount so SSR matches client output.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isLocale(stored)) {
        setLocaleState(stored);
      } else {
        // best-effort sniff from browser language
        const nav = (navigator.language || "").toLowerCase().slice(0, 2);
        if (isLocale(nav)) setLocaleState(nav);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Update <html dir> for RTL languages like Urdu.
  useEffect(() => {
    const meta = getLocaleMeta(locale);
    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("dir", meta.dir);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => {
      const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
      const tmpl = dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key;
      return format(tmpl, vars);
    },
    [locale],
  );

  const cityName = useCallback(
    (id: CityId) => CITIES[id]?.nameI18n?.[locale] ?? CITIES[id]?.name ?? id,
    [locale],
  );

  const value = useMemo<Ctx>(
    () => ({ locale, setLocale, t, cityName }),
    [locale, setLocale, t, cityName],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: StringKey, vars?: Record<string, string | number>) =>
        format(
          DICTIONARIES[DEFAULT_LOCALE][key] ?? key,
          vars,
        ),
      cityName: (id: CityId) => CITIES[id]?.name ?? id,
    } as Ctx;
  }
  return ctx;
}

export const LOCALES_LIST = LOCALES;
