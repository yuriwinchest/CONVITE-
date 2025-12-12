import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Portuguese translations
import ptCommon from './locales/pt/common.json';
import ptHome from './locales/pt/home.json';
import ptAuth from './locales/pt/auth.json';
import ptPricing from './locales/pt/pricing.json';

// Spanish translations
import esCommon from './locales/es/common.json';
import esHome from './locales/es/home.json';
import esAuth from './locales/es/auth.json';
import esPricing from './locales/es/pricing.json';

const resources = {
  pt: {
    common: ptCommon,
    home: ptHome,
    auth: ptAuth,
    pricing: ptPricing,
  },
  es: {
    common: esCommon,
    home: esHome,
    auth: esAuth,
    pricing: esPricing,
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
