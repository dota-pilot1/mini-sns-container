import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Card } from '@/shared/ui/card'

const signupSchema = z
  .object({
    nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다.'),
    email: z.email('유효한 이메일을 입력하세요.'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
    confirmPassword: z.string().min(8, '비밀번호를 다시 입력하세요.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupPage() {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      nickname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: SignupFormValues) => {
    await Promise.resolve(values)
    window.alert(JSON.stringify(values, null, 2))
  }

  return (
    <Card
      title={t('signup.title')}
      description={t('signup.description')}
      className="mx-auto max-w-xl"
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="grid gap-2">
          <span className="text-sm font-medium">{t('form.nickname')}</span>
          <input
            {...register('nickname')}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring)]"
            placeholder={t('form.nicknamePlaceholder')}
          />
          {errors.nickname ? (
            <span className="text-sm text-red-500">
              {errors.nickname.message}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">{t('form.email')}</span>
          <input
            {...register('email')}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring)]"
            placeholder="you@example.com"
            type="email"
          />
          {errors.email ? (
            <span className="text-sm text-red-500">{errors.email.message}</span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">{t('form.password')}</span>
          <input
            {...register('password')}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring)]"
            placeholder="********"
            type="password"
          />
          {errors.password ? (
            <span className="text-sm text-red-500">
              {errors.password.message}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">
            {t('form.confirmPassword')}
          </span>
          <input
            {...register('confirmPassword')}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring)]"
            placeholder="********"
            type="password"
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
          {isSubmitting ? t('common.loading') : t('common.createAccount')}
        </button>
      </form>
    </Card>
  )
}
