import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Card } from '@/shared/ui/card'
import { PasswordInput } from '@/shared/ui/password-input'

const createLoginSchema = (t: TFunction) =>
  z.object({
    email: z.email(t('form:errors.invalidEmail')),
    password: z.string().min(8, t('form:errors.passwordMin')),
  })

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>

export function LoginPage() {
  const { t } = useTranslation()
  const loginSchema = createLoginSchema(t)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    await Promise.resolve(values)
    window.alert(JSON.stringify(values, null, 2))
  }

  return (
    <Card
      title={t('auth:login.title')}
      description={t('auth:login.description')}
      className="mx-auto max-w-xl"
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="grid gap-2">
          <span className="text-sm font-medium">{t('form:email')}</span>
          <input
            {...register('email')}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring)]"
            placeholder="admin@example.com"
            type="email"
          />
          {errors.email ? (
            <span className="text-sm text-red-500">{errors.email.message}</span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">{t('form:password')}</span>
          <PasswordInput
            {...register('password')}
            placeholder="********"
          />
          {errors.password ? (
            <span className="text-sm text-red-500">
              {errors.password.message}
            </span>
          ) : null}
        </label>

        <button
          className="mt-2 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isValid || isSubmitting}
          type="submit"
        >
          {isSubmitting ? t('common:loading') : t('common:signIn')}
        </button>
      </form>
    </Card>
  )
}
