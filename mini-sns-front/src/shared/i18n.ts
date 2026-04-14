import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ko: {
    translation: {
      common: {
        tagline: '교과서형 풀스택 SNS 프론트엔드 베이스',
        startNow: '시작하기',
        signIn: '로그인',
        createAccount: '회원가입',
        loading: '처리 중...',
        darkMode: '다크',
        lightMode: '라이트',
      },
      nav: {
        home: '홈',
        login: '로그인',
        signup: '회원가입',
      },
      home: {
        badge: 'Frontend Foundation',
        title: '실무형 미니 SNS 프론트엔드의 첫 골격을 세웠습니다.',
        description:
          'TanStack Router, React Query, Zustand, react-hook-form, zod, i18n, dark mode를 한 번에 연결한 시작점입니다.',
        stackLabel: '현재 포함된 기본 세팅',
        cards: {
          router: {
            title: 'Router Ready',
            description: '홈, 로그인, 회원가입 라우트를 TanStack Router로 구성했습니다.',
          },
          form: {
            title: 'Form Ready',
            description: '로그인과 회원가입 화면에 react-hook-form + zod 검증 예제를 넣었습니다.',
          },
          theme: {
            title: 'Theme & i18n',
            description: '다크 모드 토글과 4개 언어 리소스를 기본 상태로 연결했습니다.',
          },
        },
      },
      login: {
        title: '로그인',
        description: '이 화면은 이후 OAuth2 또는 일반 로그인 API와 연결할 기본 폼입니다.',
      },
      signup: {
        title: '회원가입',
        description: '회원가입 폼과 zod 검증 구조를 바로 확장할 수 있게 준비했습니다.',
      },
      form: {
        nickname: '닉네임',
        nicknamePlaceholder: '닉네임을 입력하세요',
        email: '이메일',
        password: '비밀번호',
        confirmPassword: '비밀번호 확인',
      },
    },
  },
  en: {
    translation: {
      common: {
        tagline: 'Practical full-stack SNS frontend foundation',
        startNow: 'Get Started',
        signIn: 'Sign In',
        createAccount: 'Create Account',
        loading: 'Loading...',
        darkMode: 'Dark',
        lightMode: 'Light',
      },
      nav: {
        home: 'Home',
        login: 'Login',
        signup: 'Sign Up',
      },
      home: {
        badge: 'Frontend Foundation',
        title: 'The first practical frontend foundation for mini SNS is ready.',
        description:
          'This starter connects TanStack Router, React Query, Zustand, react-hook-form, zod, i18n, and dark mode in one place.',
        stackLabel: 'Included in the starter',
        cards: {
          router: {
            title: 'Router Ready',
            description: 'Home, login, and signup routes are configured with TanStack Router.',
          },
          form: {
            title: 'Form Ready',
            description: 'Login and signup screens already include react-hook-form and zod validation.',
          },
          theme: {
            title: 'Theme & i18n',
            description: 'Dark mode toggle and four-language resources are wired in from day one.',
          },
        },
      },
      login: {
        title: 'Login',
        description: 'This form is ready to connect to OAuth2 or standard sign-in flows later.',
      },
      signup: {
        title: 'Sign Up',
        description: 'The signup form is prepared to grow into the real registration flow.',
      },
      form: {
        nickname: 'Nickname',
        nicknamePlaceholder: 'Enter your nickname',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm password',
      },
    },
  },
  ja: {
    translation: {
      common: {
        tagline: '実務向けフルスタックSNSフロントエンド基盤',
        startNow: '始める',
        signIn: 'ログイン',
        createAccount: '新規登録',
        loading: '処理中...',
        darkMode: 'ダーク',
        lightMode: 'ライト',
      },
      nav: {
        home: 'ホーム',
        login: 'ログイン',
        signup: '新規登録',
      },
      home: {
        badge: 'Frontend Foundation',
        title: '実務型ミニSNSフロントエンドの土台を用意しました。',
        description:
          'TanStack Router、React Query、Zustand、react-hook-form、zod、i18n、ダークモードを最初から接続しています。',
        stackLabel: '含まれている初期設定',
        cards: {
          router: {
            title: 'Router Ready',
            description: 'ホーム、ログイン、会員登録ルートをTanStack Routerで構成しました。',
          },
          form: {
            title: 'Form Ready',
            description: 'ログインと会員登録画面にreact-hook-form + zodの検証例を入れました。',
          },
          theme: {
            title: 'Theme & i18n',
            description: 'ダークモード切替と4言語リソースを初期状態で接続しました。',
          },
        },
      },
      login: {
        title: 'ログイン',
        description: 'OAuth2または通常ログインAPIに接続するための基本フォームです。',
      },
      signup: {
        title: '新規登録',
        description: '実際の登録フローへ拡張しやすい構造で準備しています。',
      },
      form: {
        nickname: 'ニックネーム',
        nicknamePlaceholder: 'ニックネームを入力してください',
        email: 'メール',
        password: 'パスワード',
        confirmPassword: 'パスワード確認',
      },
    },
  },
  zh: {
    translation: {
      common: {
        tagline: '实战型全栈 SNS 前端基础工程',
        startNow: '开始',
        signIn: '登录',
        createAccount: '注册',
        loading: '处理中...',
        darkMode: '深色',
        lightMode: '浅色',
      },
      nav: {
        home: '首页',
        login: '登录',
        signup: '注册',
      },
      home: {
        badge: 'Frontend Foundation',
        title: '实战型 mini SNS 前端骨架已经搭好。',
        description:
          '这个起始工程一次性连接了 TanStack Router、React Query、Zustand、react-hook-form、zod、i18n 和深色模式。',
        stackLabel: '当前基础配置',
        cards: {
          router: {
            title: 'Router Ready',
            description: '首页、登录、注册路由已使用 TanStack Router 配置完成。',
          },
          form: {
            title: 'Form Ready',
            description: '登录和注册页面内置了 react-hook-form + zod 校验示例。',
          },
          theme: {
            title: 'Theme & i18n',
            description: '默认接入深色模式切换和四语言资源。',
          },
        },
      },
      login: {
        title: '登录',
        description: '这个表单后续可直接接入 OAuth2 或普通登录 API。',
      },
      signup: {
        title: '注册',
        description: '注册表单结构已经准备好，后续可直接扩展为真实流程。',
      },
      form: {
        nickname: '昵称',
        nicknamePlaceholder: '请输入昵称',
        email: '邮箱',
        password: '密码',
        confirmPassword: '确认密码',
      },
    },
  },
}

void i18n.use(initReactI18next).init({
  resources,
  lng: 'ko',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})
