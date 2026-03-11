import '@testing-library/jest-dom';
import '../i18n/i18n';
import i18n from 'i18next';

// Force Spanish locale for all tests
i18n.changeLanguage('es');
