# stay-ops-front

`stay-ops-container`의 관리자 프론트엔드 프로젝트입니다.

기준정보 관리 화면, 운영 조회 화면, 로그인/권한 흐름을 단계적으로 구축하기 위한 React 기반 관리자 UI 골격을 제공합니다.

## 현재 포함된 구성

- Vite + React + TypeScript
- TanStack Router
- TanStack Query
- react-hook-form + zod
- Zustand
- react-i18next
- Tailwind CSS v4
- 홈 / 로그인 / 회원가입 기본 화면
- 다크 모드 / 다국어 초기 연결

## 목표 화면 방향

이 프론트엔드는 아래 영역을 우선 대상으로 합니다.

- 관리자 로그인
- 기준정보 목록 / 상세 / 등록 / 수정 화면
- 검색 조건 조합이 있는 운영 조회 화면
- 권한에 따라 노출이 달라지는 메뉴 구조
- 다운로드 / 배치 보조 UI

## 실행

```bash
pnpm install
pnpm dev
```

기본 개발 서버 주소:

- `http://localhost:5173`

## 기술 선택 포인트

- `TanStack Router`: 관리자 메뉴와 보호 라우트 구성
- `TanStack Query`: 조회 화면의 서버 상태 관리
- `react-hook-form` + `zod`: 등록 / 수정 폼 검증
- `Zustand`: 화면 전역 UI 상태 관리
- `react-i18next`: 다국어 리소스 구성 연습

## 다음 작업 후보

- 로그인 이후 레이아웃 분리
- 기준정보 목록 테이블 화면 추가
- 검색 조건 폼과 목록 조회 연결
- 권한 기반 메뉴 렌더링
- 공통 API 클라이언트 연결

## 한줄 요약

관리자형 기준정보 관리와 운영 조회 UI를 위한 프론트엔드 시작점입니다.
