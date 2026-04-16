# 로그인에서 Zod 사용 예시


## Zod 가 뭔가?
===================================================================
폼에 입력된 값이 올바른지 검사하는 라이브러리.
"이메일 형식 맞아?" "비밀번호 8자 이상이야?" 같은 규칙을 정의하고,
틀리면 에러 메시지를 자동으로 만들어줌.
===================================================================


## Step1: 스키마 정의 = "이 폼에 뭘 입력해야 하는지" 규칙 선언
===================================================================
```ts
const createLoginSchema = (t: TFunction) =>
  z.object({
    email: z.email(t('form:errors.invalidEmail')),
    password: z.string().min(8, t('form:errors.passwordMin')),
  })
```
===================================================================
→ `z.object({ ... })` : "이 폼은 email 과 password 두 필드가 있다"
→ `z.email(...)` : "email 필드는 이메일 형식이어야 한다. 아니면 이 메시지 보여줘"
→ `z.string().min(8, ...)` : "password 는 문자열이고 최소 8자. 짧으면 이 메시지 보여줘"
→ `t(...)` : i18n 번역 함수. 에러 메시지도 다국어 지원.


## Step2: react-hook-form 과 연결
===================================================================
```ts
type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>

const {
  register,
  handleSubmit,
  formState: { errors, isValid },
} = useForm<LoginFormValues>({
  resolver: zodResolver(loginSchema),
  mode: 'onChange',
})
```
===================================================================
→ `z.infer<...>` : 스키마에서 타입을 자동 추출. 직접 타입 안 써도 됨.
   → 결과: `{ email: string, password: string }`
→ `zodResolver(loginSchema)` : react-hook-form 검증기로 zod 스키마를 사용.
→ `mode: 'onChange'` : 타이핑할 때마다 실시간 검증 (submit 안 눌러도).
→ `errors` : 검증 실패한 필드별 에러 메시지가 들어있음.
→ `isValid` : 모든 필드가 통과했는지 (true/false). 버튼 활성화에 사용.


## Step3: 에러 메시지 표시
===================================================================
```tsx
{errors.email ? (
  <span className="text-sm text-red-500">{errors.email.message}</span>
) : null}
```
===================================================================
→ `errors.email` 이 있으면 (검증 실패) → 빨간 글씨로 메시지 표시.
→ `errors.email.message` 안에 Step1 에서 넣은 `t('form:errors.invalidEmail')` 이 들어있음.
→ 검증 통과하면 `errors.email` 은 undefined → 아무것도 안 보임.


## 전체 흐름 (한눈에)
===================================================================
```
사용자가 이메일 입력
  → zod: "이메일 형식 맞나?" 검사
  → 틀리면 → errors.email.message 에 에러 담김 → 빨간 텍스트 표시
  → 맞으면 → errors.email = undefined → 에러 사라짐

사용자가 비밀번호 입력
  → zod: "8자 이상인가?" 검사
  → 짧으면 → errors.password.message → 빨간 텍스트
  → 충분하면 → 에러 사라짐

둘 다 통과 → isValid = true → 로그인 버튼 활성화
```
===================================================================


## 한 줄 요약
===================================================================
"zod 로 '이 필드는 이런 형식이어야 해' 규칙을 선언하고,
 zodResolver 가 react-hook-form 에 연결해서 실시간 검증 + 에러 메시지 자동 생성."
===================================================================
