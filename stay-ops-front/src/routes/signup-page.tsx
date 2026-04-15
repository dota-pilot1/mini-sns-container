import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { useSignup } from '@/features/auth/signup'
import { ApiError } from '@/shared/api/types'
import { Card } from '@/shared/ui/card'
import { PasswordInput } from '@/shared/ui/password-input'

const createSignupSchema = (t: TFunction) =>
  z
    .object({
      name: z.string().min(2, t('form:errors.nameMin')),
      email: z.email(t('form:errors.invalidEmail')),
      password: z.string().min(8, t('form:errors.passwordMin')),
      confirmPassword: z
        .string()
        .min(8, t('form:errors.confirmPasswordRequired')),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: t('form:errors.passwordMismatch'),
      path: ['confirmPassword'],
    })

type SignupFormValues = z.infer<ReturnType<typeof createSignupSchema>>

export function SignupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const signup = useSignup()

  const signupSchema = createSignupSchema(t)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: SignupFormValues) => {
    try {
      await signup.mutateAsync({
        email: values.email,
        password: values.password,
        name: values.name,
      })
      window.alert(t('form:submit.signupSuccess'))
      navigate({ to: '/login' })
    } catch (err) {
      if (err instanceof ApiError) {
        // 필드별 에러 먼저 매핑
        if (err.fieldErrors.length > 0) {
          err.fieldErrors.forEach((fe) => {
            if (
              fe.field === 'email' ||
              fe.field === 'password' ||
              fe.field === 'name'
            ) {
              setError(fe.field, { type: 'server', message: fe.message })
            }
          })
          return
        }
        // 코드 기반 분기
        if (err.code === 'DUPLICATE_EMAIL') {
          setError('email', { type: 'server', message: err.message })
          return
        }
        if (err.code === 'INVALID_EMAIL') {
          setError('email', { type: 'server', message: err.message })
          return
        }
        if (err.code === 'WEAK_PASSWORD') {
          setError('password', { type: 'server', message: err.message })
          return
        }
      }
      window.alert(t('form:submit.signupGenericError'))
    }
  }

  const isSubmitting = signup.isPending

  return (
    <Card
      title={t('auth:signup.title')}
      description={t('auth:signup.description')}
      className="mx-auto max-w-xl"
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="grid gap-2">
          <span className="text-sm font-medium">{t('form:name')}</span>
          <input
            {...register('name')}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring)]"
            placeholder={t('form:namePlaceholder')}
          />
          {errors.name ? (
            <span className="text-sm text-red-500">{errors.name.message}</span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">{t('form:email')}</span>
          <input
            {...register('email')}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring)]"
            placeholder="user@example.com"
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

        <label className="grid gap-2">
          <span className="text-sm font-medium">
            {t('form:confirmPassword')}
          </span>
          <PasswordInput
            {...register('confirmPassword')}
            placeholder="********"
          />
          {errors.confirmPassword ? (
            <span className="text-sm text-red-500">
              {errors.confirmPassword.message}
            </span>
          ) : null}
        </label>

        <button
          className="mt-2 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 font-semibold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isValid || isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? t('form:submit.signupLoading')
            : t('common:createAccount')}
        </button>
      </form>
    </Card>
  )
}
