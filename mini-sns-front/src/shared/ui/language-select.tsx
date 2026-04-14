import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'ko', label: 'KO' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: 'JA' },
  { code: 'zh', label: 'ZH' },
] as const

export function LanguageSelect() {
  const { i18n } = useTranslation()

  return (
    <label className="relative">
      <select
        aria-label="Language"
        className="min-w-22 appearance-none rounded-full bg-transparent py-2 pl-4 pr-9 text-sm font-semibold tracking-[0.04em] text-[var(--foreground)] outline-none transition focus:ring-4 focus:ring-[var(--ring)]"
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value)
        }}
        value={i18n.language}
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)]">
        ▼
      </span>
    </label>
  )
}
