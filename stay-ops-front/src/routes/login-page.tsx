import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { useLogin } from '@/features/auth/login'
import { ApiError } from '@/shared/api/types'
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
  const navigate = useNavigate()
  const loginSchema = createLoginSchema(t)
  const { mutateAsync } = useLogin()
  const [serverError, setServerError] = useState<string | null>(null)

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
    setServerError(null)
    try {
      await mutateAsync({ email: values.email, password: values.password })
      // redirect 쿼리가 있으면 그쪽으로, 없으면 홈
      const params = new URLSearchParams(window.location.search)
      const redirectTo = params.get('redirect') ?? '/'
      await navigate({ to: redirectTo })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
        setServerError(t('auth:login.invalidCredentials'))
      } else {
        setServerError(t('auth:login.unknownError'))
      }
    }
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

        {serverError ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {serverError}
          </p>
        ) : null}

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
