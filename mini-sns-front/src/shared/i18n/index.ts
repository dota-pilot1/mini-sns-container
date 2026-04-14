import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { en } from '@/shared/i18n/resources/en'
import { ja } from '@/shared/i18n/resources/ja'
import { ko } from '@/shared/i18n/resources/ko'
import { zh } from '@/shared/i18n/resources/zh'

const resources = {
  ko,
  en,
  ja,
  zh,
}

void i18n.use(initReactI18next).init({
  resources,
  lng: 'ko',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'nav', 'home', 'auth', 'form'],
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
