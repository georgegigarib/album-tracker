import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import esCommon from './es/common.json';
import esAuth from './es/auth.json';
import esDashboard from './es/dashboard.json';
import esAlbumDetail from './es/albumDetail.json';
import esSongDetail from './es/songDetail.json';
import esAlbumSettings from './es/albumSettings.json';
import esProfile from './es/profile.json';
import esNavbar from './es/navbar.json';
import esInstruments from './es/instruments.json';
import esComponents from './es/components.json';

import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enDashboard from './en/dashboard.json';
import enAlbumDetail from './en/albumDetail.json';
import enSongDetail from './en/songDetail.json';
import enAlbumSettings from './en/albumSettings.json';
import enProfile from './en/profile.json';
import enNavbar from './en/navbar.json';
import enInstruments from './en/instruments.json';
import enComponents from './en/components.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: esCommon,
        auth: esAuth,
        dashboard: esDashboard,
        albumDetail: esAlbumDetail,
        songDetail: esSongDetail,
        albumSettings: esAlbumSettings,
        profile: esProfile,
        navbar: esNavbar,
        instruments: esInstruments,
        components: esComponents,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        dashboard: enDashboard,
        albumDetail: enAlbumDetail,
        songDetail: enSongDetail,
        albumSettings: enAlbumSettings,
        profile: enProfile,
        navbar: enNavbar,
        instruments: enInstruments,
        components: enComponents,
      },
    },
    fallbackLng: 'es',
    ns: ['common', 'auth', 'dashboard', 'albumDetail', 'songDetail', 'albumSettings', 'profile', 'navbar', 'instruments', 'components'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
