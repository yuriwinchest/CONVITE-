import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Portuguese translations
import ptCommon from './locales/pt/common.json';
import ptHome from './locales/pt/home.json';
import ptAuth from './locales/pt/auth.json';
import ptPricing from './locales/pt/pricing.json';
import ptAbout from './locales/pt/about.json';
import ptDashboard from './locales/pt/dashboard.json';
import ptConfirm from './locales/pt/confirm.json';
import ptEvents from './locales/pt/events.json';
import ptGuests from './locales/pt/guests.json';

// Spanish translations
import esCommon from './locales/es/common.json';
import esHome from './locales/es/home.json';
import esAuth from './locales/es/auth.json';
import esPricing from './locales/es/pricing.json';
import esAbout from './locales/es/about.json';
import esDashboard from './locales/es/dashboard.json';
import esConfirm from './locales/es/confirm.json';
import esEvents from './locales/es/events.json';
import esGuests from './locales/es/guests.json';

const resources = {
  pt: {
    common: ptCommon,
    home: ptHome,
    auth: ptAuth,
    pricing: ptPricing,
    about: ptAbout,
    dashboard: ptDashboard,
    confirm: ptConfirm,
    events: ptEvents,
    guests: ptGuests,
  },
  es: {
    common: esCommon,
    home: esHome,
    auth: esAuth,
    pricing: esPricing,
    about: esAbout,
    dashboard: esDashboard,
    confirm: esConfirm,
    events: esEvents,
    guests: esGuests,
  },
};

// Get saved language or default to Portuguese
const savedLanguage = typeof window !== 'undefined' 
  ? localStorage.getItem('language') || 'pt'
  : 'pt';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'pt',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
