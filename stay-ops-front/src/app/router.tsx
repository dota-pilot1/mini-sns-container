import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { z } from 'zod'

import { ROOM_STATUSES } from '@/features/room/model/room-types'
import { HomePage } from '@/routes/home-page'
import { LoginPage } from '@/routes/login-page'
import { RoomDetailPage } from '@/routes/room-detail-page'
import { RoomListPage } from '@/routes/room-list-page'
import { SignupPage } from '@/routes/signup-page'
import { TenantListPage } from '@/routes/tenant-list-page'
import { UserListPage } from '@/routes/user-list-page'
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

/**
 * /rooms 쿼리스트링 스키마.
 * - view: 카드/칸반/테이블 뷰 모드
 * - floor: 층 필터 (ex. ?floor=7)
 * - status: 상태 필터 (ex. ?status=VACANT)
 * - selected: 드로어로 열린 방 id — 딥링크 & 새로고침 복원
 * 모든 필드 optional. `catch` 로 파싱 실패 시 undefined 로 fallback (깨진 URL 도 복구).
 */
export const roomsSearchSchema = z.object({
  view: z.enum(['floor', 'kanban', 'table']).optional().catch(undefined),
  floor: z.coerce.number().int().optional().catch(undefined),
  status: z.enum(ROOM_STATUSES).optional().catch(undefined),
  selected: z.string().optional().catch(undefined),
})

export type RoomsSearch = z.infer<typeof roomsSearchSchema>

export const roomsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms',
  beforeLoad: requireAuth,
  component: RoomListPage,
  validateSearch: (search) => roomsSearchSchema.parse(search),
})

export const roomDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rooms/$roomId',
  beforeLoad: requireAuth,
  component: RoomDetailPage,
})

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  beforeLoad: requireAuth,
  component: UserListPage,
})

/**
 * /tenants 쿼리스트링 스키마.
 * - selected: 드로어로 열린 입주자 id — 딥링크 & 새로고침 복원
 */
export const tenantsSearchSchema = z.object({
  selected: z.string().optional().catch(undefined),
})

export type TenantsSearch = z.infer<typeof tenantsSearchSchema>

const tenantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tenants',
  beforeLoad: requireAuth,
  component: TenantListPage,
  validateSearch: (search) => tenantsSearchSchema.parse(search),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  roomsRoute,
  roomDetailRoute,
  usersRoute,
  tenantsRoute,
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
