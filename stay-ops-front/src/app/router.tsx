import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'

import { HomePage } from '@/routes/home-page'
import { LoginPage } from '@/routes/login-page'
import { RoomListPage } from '@/routes/room-list-page'
import { SignupPage } from '@/routes/signup-page'
import { useAuthStore } from '@/shared/auth/auth-store'
import { AppShell } from '@/shared/layouts/app-shell'

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})

/**
 * 인증 필요 라우트의 beforeLoad 가드.
 * 토큰 없으면 /login 으로 리다이렉트, redirect 쿼리로 원래 경로 유지.
 */
function requireAuth({ location }: { location: { href: string } }) {
  const token = useAuthStore.getState().accessToken
  if (!token) {
    throw redirect({
      to: '/login',
      search: { redirect: location.href },
    })
  }
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: requireAuth,
  component: HomePage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupPage,
})

const roomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms',
  beforeLoad: requireAuth,
  component: RoomListPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  roomsRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
