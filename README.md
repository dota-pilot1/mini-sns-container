# mini-sns-container

실무형 미니 SNS를 목표로 하는 풀스택 프로젝트 저장소입니다.  
프론트엔드와 백엔드를 분리해서 구성하고, 초기 세팅 과정과 구현 내역을 문서로 함께 관리합니다.

## 프로젝트 소개

이 저장소는 단순 CRUD 예제가 아니라, 실제 서비스 개발 흐름을 연습할 수 있는 교과서형 프로젝트를 목표로 합니다.

주요 방향:
- OAuth2 기반 로그인
- 회원가입 및 사용자 관리
- 게시글 / 댓글 / 좋아요
- Role / Permission 기반 권한 관리
- 다국어 및 다크 모드
- 카드형 피드 UI와 게시판 UI
- 실시간 댓글 / 알림 기능
- 설문 및 관리자 기능 확장

## 저장소 구조

```text
mini-sns-container
├── mini-sns-server
├── mini-sns-front
└── docs-for-완료
```

### `mini-sns-server`

Spring Boot 기반 백엔드 프로젝트입니다.

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
- [mini-sns-server README](./mini-sns-server/README.md)

### `mini-sns-front`

Vite 기반 React 프론트엔드 프로젝트입니다.

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

### `docs-for-완료`

초기 세팅 및 구현 내역을 정리하는 문서 폴더입니다.

현재 정리된 항목 예시:
- vite 리액트 타입스크립트 세팅
- tanstack router 기본 라우팅 구성
- tanstack query provider 연결
- react hook form zod 로그인 회원가입 폼 예제
- zustand 다크모드 상태 저장
- react i18next 기본 연결
- 다국어 리소스 추가
- 기본 라우트 추가
- 공통 레이아웃 헤더 구성
- tailwind 전역 스타일 구성

## 현재 진행 상태

### 완료된 초기 작업

- [x] 백엔드 프로젝트 생성
- [x] PostgreSQL 도커 컴포즈 설정
- [x] 백엔드 헬스 체크 추가
- [x] 백엔드 기본 보안 설정
- [x] 프론트 프로젝트 생성
- [x] 프론트 기본 라우팅 구성
- [x] 로그인 / 회원가입 폼 예제 추가
- [x] 다국어 초기 세팅
- [x] 다크 모드 상태 저장
- [x] 초기 세팅 문서화

### 다음 작업 예정

- [ ] 백엔드 공통 예외 처리
- [ ] 백엔드 공통 응답 구조
- [ ] OAuth2 로그인 플로우
- [ ] User / Post / Comment 도메인 설계
- [ ] 프론트 API 클라이언트 연결
- [ ] 인증 상태 관리
- [ ] 보호 라우트
- [ ] 게시글 / 댓글 / 좋아요 기능 연동

## 빠른 실행 방법

### 1. 백엔드 실행

```bash
cd mini-sns-server
docker compose up -d
./gradlew bootRun
```

헬스 체크:

```bash
curl http://localhost:8080/actuator/health
```

### 2. 프론트 실행

```bash
cd mini-sns-front
pnpm install
pnpm dev
```

기본 접속 주소:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## 문서 기준

이 저장소는 구현만 하지 않고, 초기 세팅과 구조 설계를 문서로 함께 남기는 방식으로 관리합니다.

문서 위치:
- [초기 세팅 설정](./docs-for-%EC%99%84%EB%A3%8C/%EC%B4%88%EA%B8%B0%20%EC%84%B8%ED%8C%85%20%EC%84%A4%EC%A0%95)

각 문서는 아래 형식으로 정리합니다.
- 관련 파일 구조
- 구현 체크리스트
- 주요 파일 및 코드 설명

## 한줄 요약

실무형 미니 SNS를 목표로 프론트엔드, 백엔드, 초기 세팅 문서를 함께 관리하는 풀스택 프로젝트 저장소입니다.
