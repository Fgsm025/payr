export type Locale = 'en' | 'es'

type TranslationDict = Record<string, string>

export const translations: Record<Locale, TranslationDict> = {
  en: {
    'topbar.subtitle': 'Finance workspace by legal entity',
    'topbar.darkmode.toggle': 'Toggle dark mode',
    'topbar.account.settings': 'Account settings',
    'topbar.language.es': 'Spanish',
    'topbar.language.en': 'English',

    'nav.home': 'Home',
    'nav.bills': 'Bills',
    'nav.vendors': 'Vendors',
    'nav.payments': 'Payments',
    'nav.settings': 'Settings',
    'nav.help': 'Help & Support',
    'nav.privacy': 'Privacy Policy',
    'nav.logout': 'Logout',

    'page.overview': 'Overview',
    'page.bills': 'Bills',
    'page.vendors': 'Vendors',
    'page.payments': 'Payments',
    'page.settings': 'Settings',
    'page.default': 'Payr',
  },
  es: {
    'topbar.subtitle': 'Espacio financiero por entidad legal',
    'topbar.darkmode.toggle': 'Cambiar modo oscuro',
    'topbar.account.settings': 'Configuración de cuenta',
    'topbar.language.es': 'Español',
    'topbar.language.en': 'Inglés',

    'nav.home': 'Inicio',
    'nav.bills': 'Facturas',
    'nav.vendors': 'Proveedores',
    'nav.payments': 'Pagos',
    'nav.settings': 'Configuración',
    'nav.help': 'Ayuda y soporte',
    'nav.privacy': 'Política de privacidad',
    'nav.logout': 'Cerrar sesión',

    'page.overview': 'Resumen',
    'page.bills': 'Facturas',
    'page.vendors': 'Proveedores',
    'page.payments': 'Pagos',
    'page.settings': 'Configuración',
    'page.default': 'Payr',
  },
}
