export type Locale =
  | "en"
  | "hi"
  | "bn"
  | "mr"
  | "te"
  | "ta"
  | "gu"
  | "ur"
  | "kn"
  | "or"
  | "ml"
  | "pa"
  | "as";

export type LocaleMeta = {
  id: Locale;
  english: string;
  native: string;
  dir: "ltr" | "rtl";
};

export const LOCALES: LocaleMeta[] = [
  { id: "en", english: "English", native: "English", dir: "ltr" },
  { id: "hi", english: "Hindi", native: "हिन्दी", dir: "ltr" },
  { id: "bn", english: "Bengali", native: "বাংলা", dir: "ltr" },
  { id: "mr", english: "Marathi", native: "मराठी", dir: "ltr" },
  { id: "te", english: "Telugu", native: "తెలుగు", dir: "ltr" },
  { id: "ta", english: "Tamil", native: "தமிழ்", dir: "ltr" },
  { id: "gu", english: "Gujarati", native: "ગુજરાતી", dir: "ltr" },
  { id: "ur", english: "Urdu", native: "اردو", dir: "rtl" },
  { id: "kn", english: "Kannada", native: "ಕನ್ನಡ", dir: "ltr" },
  { id: "or", english: "Odia", native: "ଓଡ଼ିଆ", dir: "ltr" },
  { id: "ml", english: "Malayalam", native: "മലയാളം", dir: "ltr" },
  { id: "pa", english: "Punjabi", native: "ਪੰਜਾਬੀ", dir: "ltr" },
  { id: "as", english: "Assamese", native: "অসমীয়া", dir: "ltr" },
];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(s: string): s is Locale {
  return LOCALES.some((l) => l.id === s);
}

export function getLocaleMeta(id: Locale): LocaleMeta {
  return LOCALES.find((l) => l.id === id) ?? LOCALES[0];
}
