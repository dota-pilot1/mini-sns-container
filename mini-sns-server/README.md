# mini-sns-server

미니 SNS 프로젝트의 백엔드 서버입니다.  
Spring Boot 기반으로 인증, 권한, 게시글/댓글/좋아요, 실시간 알림, 설문, 관리자 기능까지 확장 가능한 구조를 목표로 합니다.

## 1. 프로젝트 개요

`mini-sns-server`는 실무형 풀스택 SNS 예제를 위한 서버 프로젝트입니다.

현재는 서버 기본 골격을 구성한 초기 단계이며, 아래 항목이 준비되어 있습니다.
- Spring Boot 4.0.5 기반 서버 실행
- PostgreSQL 연동
- Actuator 헬스 체크
- Spring Security 기본 설정
- Docker Compose 기반 로컬 DB 실행

아래 기능들은 앞으로 구현할 목표 범위입니다.
- OAuth2 소셜 로그인
- 회원가입 및 사용자 관리
- Role / Permission 기반 권한 관리
- 게시글 / 댓글 / 좋아요
- 실시간 댓글 / 알림
- 설문 기능
- 관리자 기능

## 2. 기술 스택

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

추후 도입 예정:
- Redis
- WebSocket 또는 SSE
- Swagger / OpenAPI

## 3. 현재 구현 상태

현재 코드 기준으로 구현된 내용:
- 애플리케이션 기동
- PostgreSQL 데이터소스 연결
- `/actuator/health` 및 `/actuator/info` 공개
- 기본 보안 필터 체인 적용
- 테스트 실행 가능

아직 구현되지 않은 내용:
- 회원 도메인
- 게시글 / 댓글 / 좋아요 도메인
- OAuth2 로그인 플로우
- Redis 연동
- 실시간 기능
- 관리자 기능
- API 명세

## 4. 현재 프로젝트 구조

현재 실제 프로젝트 구조:

```text
src/main/java/com/cj/minisns/backend
├── MiniSnsServerApplication.java
└── config
    └── SecurityConfig.java

src/main/resources
└── application.yaml
```

예상 확장 구조:

```text
src/main/java/com/cj/minisns/backend
├── auth
├── user
├── post
├── comment
├── like
├── notification
├── poll
├── admin
├── realtime
├── config
└── common
```

## 5. 서버 책임 범위

이 서버는 아래 영역을 담당할 예정입니다.
- 인증 및 인가 처리
- 사용자 및 권한 관리
- 게시글, 댓글, 좋아요 도메인 로직
- 실시간 이벤트 발행
- 알림 데이터 관리
- 설문 기능 API
- 관리자용 관리 API

프론트엔드 UI, 라우팅, 폼 상태, 다크 모드, 에디터 렌더링 등은 클라이언트 프로젝트에서 담당합니다.

## 6. 실행 환경

현재 로컬 실행 기준 요구사항:
- Java 21
- Docker / Docker Compose
- PostgreSQL 16+

참고:
- Redis는 아직 이 프로젝트에 추가되지 않았습니다.

## 7. 로컬 실행

### 1) 데이터베이스 실행

```bash
docker compose up -d
```

기본 PostgreSQL 정보:
- DB: `minisns`
- USER: `minisns`
- PASSWORD: `minisns1234`

### 2) 애플리케이션 실행

```bash
./gradlew bootRun
```

포트 충돌 시:

```bash
SERVER_PORT=8081 ./gradlew bootRun
```

## 8. 설정

현재 기본 설정 파일:
- `src/main/resources/application.yaml`

주요 환경 변수 예시:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/minisns
SPRING_DATASOURCE_USERNAME=minisns
SPRING_DATASOURCE_PASSWORD=minisns1234
SERVER_PORT=8080
```

추후 추가 가능 항목:
- OAuth2 Client 설정
- Redis 접속 정보
- JWT 또는 세션 설정
- CORS 설정
- 파일 업로드 설정

## 9. 헬스 체크

서버 상태 확인용 actuator endpoint를 제공합니다.

```bash
curl http://localhost:8080/actuator/health
```

예시 응답:

```json
{
  "groups": ["liveness", "readiness"],
  "status": "UP"
}
```

## 10. 보안 설정

현재는 Spring Security 기본 설정 위에 최소한의 보안 구성이 들어가 있습니다.

현재 공개 endpoint:
- `/actuator/health`
- `/actuator/info`

그 외 요청은 인증이 필요하도록 설정되어 있습니다.

향후 확장 방향:
- OAuth2 로그인
- Role / Permission 기반 인가
- 관리자 권한 분리
- 공개 API / 보호 API 세분화

## 11. 데이터 저장소 방향

현재 사용 중:
- PostgreSQL

추후 도입 예정:
- Redis

예상 주요 테이블:
- users
- roles
- permissions
- posts
- comments
- post_likes
- notifications
- polls
- poll_options
- poll_votes

## 12. 테스트

```bash
./gradlew test
```

## 13. 개발 체크리스트

### 기반 구성

- [x] Spring Boot 프로젝트 생성
- [x] PostgreSQL 연동
- [x] Docker Compose로 DB 실행
- [x] Actuator 헬스 체크 추가
- [x] 기본 Security 설정 추가
- [ ] Redis 의존성 및 로컬 실행 환경 추가
- [ ] 공통 예외 처리 구조 추가
- [ ] 공통 응답 포맷 정의
- [ ] API 문서화 도구 추가

### 인증 / 사용자

- [ ] OAuth2 로그인 구현
- [ ] 회원가입 API 구현
- [ ] 사용자 프로필 조회 / 수정
- [ ] Role / Permission 모델링
- [ ] 관리자 권한 분리

### 게시판 / 피드

- [ ] 게시글 엔티티 설계
- [ ] 게시글 CRUD API
- [ ] 댓글 CRUD API
- [ ] 좋아요 기능
- [ ] 피드 조회 API
- [ ] 검색 기능
- [ ] 북마크 기능

### 실시간 / 알림

- [ ] WebSocket 또는 SSE 선택
- [ ] 댓글 실시간 반영
- [ ] 좋아요 알림
- [ ] 댓글 알림
- [ ] 활동 피드

### 추가 기능

- [ ] 설문 엔티티 및 API
- [ ] 이미지 업로드
- [ ] 관리자 페이지용 API
- [ ] OpenAPI / Swagger 문서
- [ ] 배포 환경 설정

## 14. 한줄 요약

PostgreSQL, Security, 헬스 체크까지 갖춘 미니 SNS 백엔드의 초기 서버 골격 프로젝트입니다.
