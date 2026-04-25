import { useAppStore } from '../store/useAppStore'
import { translations, type Locale } from './translations'

export function useI18n() {
  const locale = useAppStore((state) => state.locale)
  const setLocale = useAppStore((state) => state.setLocale)

  const t = (key: string) => translations[locale][key] ?? translations.en[key] ?? key

  return {
    locale,
    setLocale: (nextLocale: Locale) => setLocale(nextLocale),
    t,
  }
}
