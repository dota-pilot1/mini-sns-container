# fs-admin-server

`fs-admin-container`의 관리자 백엔드 서버입니다.

기준정보 관리, 운영 조회, 권한 제어, 외부 시스템 연동용 기준 데이터 관리를 담당하는 Spring Boot 기반 서버를 목표로 합니다.

## 프로젝트 개요

현재는 서버 기본 골격을 구성한 초기 단계이며, 아래 항목이 준비되어 있습니다.

- Spring Boot 4.0.5 기반 서버 실행
- PostgreSQL 연동
- Actuator 헬스 체크
- Spring Security 기본 설정
- Docker Compose 기반 로컬 DB 실행

이후 구현 범위는 아래를 기준으로 확장합니다.

- 관리자 로그인 및 인증
- Role / Permission 기반 권한 관리
- 상품 / 카테고리 / 매장 / 채널 기준정보 관리
- 외부 시스템 코드 매핑 관리
- 운영용 검색 / 조회 API
- `jOOQ` 기반 복잡 조회

## 기술 스택

현재 적용된 기술:

- Java 21
- Spring Boot 4.0.5
- Spring Web MVC
- Spring Data JPA
- Spring Security
- OAuth2 Client
- Validation
- PostgreSQL
- Lombok
- Spring Boot Devtools
- Spring Boot Actuator

도입 검토 대상:

- `jOOQ`
- Redis
- Swagger / OpenAPI

## 현재 구현 상태

현재 코드 기준으로 구현된 내용:

- 애플리케이션 기동
- PostgreSQL 데이터소스 연결
- `/actuator/health` 및 `/actuator/info` 공개
- 기본 보안 필터 체인 적용
- 테스트 실행 가능

아직 구현되지 않은 내용:

- 관리자 인증 도메인
- 기준정보 도메인
- 권한 모델
- 운영 조회 API
- `jOOQ` 연동
- API 명세

## 현재 프로젝트 구조

현재 실제 프로젝트 구조:

```text
src/main/java/com/cj/fsadmin/backend
├── FsAdminServerApplication.java
└── config
    └── SecurityConfig.java

src/main/resources
└── application.yaml
```

참고:
- 현재 기준으로 Java 패키지 경로도 `fsadmin` 기준으로 정리되어 있습니다.

예상 확장 구조:

```text
src/main/java/com/cj/fsadmin/backend
├── auth
├── common
├── masterdata
├── product
├── category
├── store
├── channel
├── mapping
├── authorization
├── operation
└── config
```

## 서버 책임 범위

이 서버는 아래 영역을 담당할 예정입니다.

- 인증 및 인가 처리
- 관리자 계정 및 권한 관리
- 기준정보 등록 / 수정 / 조회 API
- 코드 매핑 및 외부 시스템 연동 기준 데이터 관리
- 운영 화면용 검색 / 필터 / 페이징 조회
- 감사 로그 및 변경 이력 조회

프론트엔드 UI, 라우팅, 폼 상태, 다국어, 테마 토글은 클라이언트 프로젝트에서 담당합니다.

## 실행 환경

로컬 실행 기준 요구사항:

- Java 21
- Docker / Docker Compose
- PostgreSQL 16+

## 로컬 실행

### 1. 데이터베이스 실행

```bash
docker compose up -d
```

기본 PostgreSQL 정보:

- DB: `fsadmin`
- USER: `fsadmin`
- PASSWORD: `fsadmin1234`

### 2. 애플리케이션 실행

```bash
./gradlew bootRun
```

포트 충돌 시:

```bash
SERVER_PORT=8081 ./gradlew bootRun
```

## 설정

현재 기본 설정 파일:

- `src/main/resources/application.yaml`

주요 환경 변수 예시:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/fsadmin
SPRING_DATASOURCE_USERNAME=fsadmin
SPRING_DATASOURCE_PASSWORD=fsadmin1234
SERVER_PORT=8080
```

추후 추가 가능 항목:

- OpenAPI 설정
- Redis 접속 정보
- 세션 또는 토큰 정책
- CORS 설정
- 외부 시스템 연동 설정

## 헬스 체크

```bash
curl http://localhost:8080/actuator/health
```

## 보안 설정

현재 공개 endpoint:

- `/actuator/health`
- `/actuator/info`

그 외 요청은 인증이 필요하도록 설정되어 있습니다.

향후 확장 방향:

- 관리자 로그인
- Role / Permission 기반 인가
- 메뉴 / 기능 단위 접근 제어
- 조회 권한과 수정 권한 분리

## 데이터 저장소 방향

현재 사용 중:

- PostgreSQL

추후 도입 예정:

- `jOOQ`
- Redis

예상 주요 테이블:

- admin_users
- roles
- permissions
- products
- categories
- stores
- channels
- code_mappings
- integration_targets
- audit_logs

## 테스트

```bash
./gradlew test
```

## 개발 체크리스트

### 기반 구성

- [x] Spring Boot 프로젝트 생성
- [x] PostgreSQL 연동
- [x] Docker Compose로 DB 실행
- [x] Actuator 헬스 체크 추가
- [x] 기본 Security 설정 추가
- [ ] 공통 예외 처리 구조 추가
- [ ] 공통 응답 포맷 정의
- [ ] API 문서화 도구 추가
- [ ] `jOOQ` 연동 기반 추가

### 인증 / 권한

- [ ] 관리자 로그인 구현
- [ ] 관리자 계정 모델링
- [ ] Role / Permission 모델링
- [ ] 메뉴 권한 분리
- [ ] 수정 권한 분리

### 기준정보 관리

- [ ] 상품 도메인 설계
- [ ] 카테고리 도메인 설계
- [ ] 매장 도메인 설계
- [ ] 채널 도메인 설계
- [ ] 코드 매핑 도메인 설계
- [ ] 기준정보 CRUD API

### 운영 조회

- [ ] 검색 조건 객체 설계
- [ ] 목록 조회 API
- [ ] 상세 조회 API
- [ ] 페이징 / 정렬 정책 정리
- [ ] 다운로드용 조회 API

## 한줄 요약

기준정보 관리와 운영 조회를 중심으로 확장할 관리자 백엔드의 초기 서버 골격 프로젝트입니다.
