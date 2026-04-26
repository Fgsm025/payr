import { useAppStore } from '../store/useAppStore'
import { translations, type Locale } from './translations'

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string

export function useI18n() {
  const locale = useAppStore((state) => state.locale)
  const setLocale = useAppStore((state) => state.setLocale)

  const t: TranslateFn = (key, vars) => {
    let s = translations[locale][key] ?? translations.en[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{{${k}}}`, String(v))
      }
    }
    return s
  }

  return {
    locale,
    setLocale: (nextLocale: Locale) => setLocale(nextLocale),
    t,
  }
}

/** Same as useI18n — for components that expect a `useTranslation`-style hook. */
export function useTranslation() {
  return useI18n()
}
