# stay-ops-container

기준정보 관리와 운영 조회를 중심으로 연습하는 관리자형 풀스택 프로젝트 저장소입니다.

`stay-ops-container`는 거주 운영, 생활 서비스, 공지/문의 관리 같은 운영용 조회 화면을 다루는 백오피스 성격의 프로젝트를 목표로 합니다.

## 프로젝트 방향

이 저장소는 아래 연습 포인트를 기준으로 설계합니다.

- 기준정보 관리 UI/API 설계
- 운영 조회와 검색 조건 조합
- 권한 및 접근 제어
- 외부 시스템 연동용 기준 데이터 관리
- `jOOQ` 기반 복잡 조회 연습

`banchan-killer-container` 같은 서비스 시스템이 소비하는 기준정보를 관리하는 운영 시스템을 상정합니다.

## 저장소 구조

```text
stay-ops-container
├── stay-ops-server
├── stay-ops-front
└── docs-for-todo
```

### `stay-ops-server`

Spring Boot 기반 관리자 백엔드입니다.

현재 포함:
- PostgreSQL 연동
- Docker Compose 기반 DB 실행
- Spring Security 기본 설정
- Actuator 헬스 체크

주요 기술:
- Java 21
- Spring Boot 4.0.5
- Spring Web MVC
- Spring Data JPA
- Spring Security
- OAuth2 Client
- Validation
- PostgreSQL
- Actuator

문서:
- [stay-ops-server README](/Users/terecal/stay-ops-container/stay-ops-server/README.md)

### `stay-ops-front`

Vite 기반 관리자 프론트엔드입니다.

현재 포함:
- Vite + React + TypeScript
- TanStack Router
- TanStack Query
- react-hook-form + zod
- Zustand
- react-i18next
- Tailwind CSS v4
- 기본 홈 / 로그인 / 회원가입 화면
- 다크 모드 / 다국어 초기 연결

주요 기술:
- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- react-hook-form
- zod
- Zustand
- react-i18next
- Tailwind CSS

문서:
- [stay-ops-front README](/Users/terecal/stay-ops-container/stay-ops-front/README.md)

## 빠른 실행

### 1. 백엔드 실행

```bash
cd stay-ops-server
docker compose up -d
./gradlew bootRun
```

헬스 체크:

```bash
curl http://localhost:8080/actuator/health
```

### 2. 프론트 실행

```bash
cd stay-ops-front
pnpm install
pnpm dev
```

기본 접속 주소:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## 문서 관리

구현만 하지 않고 설계 의도와 작업 우선순위를 함께 관리합니다.

문서 위치:
- [todo 문서](/Users/terecal/stay-ops-container/docs-for-todo/todo.md)

각 문서는 아래 관점으로 정리합니다.
- 도메인 범위
- 우선 구현 항목
- 기술 선택 이유
- 이후 확장 방향

## 한줄 요약

기준정보 관리, 운영 조회, 권한 관리, 복잡 조회를 중심으로 연습하는 관리자형 풀스택 프로젝트 저장소입니다.
