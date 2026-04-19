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
    <label className="relative inline-flex">
      <select
        aria-label="Language"
        className="h-7 appearance-none rounded bg-transparent py-0 pl-2 pr-5 text-xs font-semibold leading-none tracking-wider text-[var(--foreground)] outline-none transition hover:bg-[var(--control-hover)] focus:ring-2 focus:ring-[var(--ring)]"
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
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--muted)]"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 4.5 L6 7.5 L9 4.5" />
      </svg>
    </label>
  )
}
