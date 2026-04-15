# Step 4. `POST /api/auth/login` 엔드포인트

## 신규 파일
```
auth/presentation/dto/LoginRequest.java
auth/presentation/dto/LoginResponse.java
```

## AuthController 수정
`signup` 옆에 `login` 핸들러 추가.

```java
@PostMapping("/login")
@Operation(summary = "로그인", description = "이메일/비밀번호로 JWT 토큰을 발급합니다.")
@ApiResponses({
  @ApiResponse(responseCode = "200", ...),
  @ApiResponse(responseCode = "400", description = "형식 오류 (VALIDATION_FAILED / INVALID_EMAIL)"),
  @ApiResponse(responseCode = "401", description = "자격 증명 실패 (INVALID_CREDENTIALS)")
})
public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    LoginResult result = loginUseCase.execute(request.toCommand());
    return ResponseEntity.ok(LoginResponse.from(result));
}
```

## LoginRequest
- `email`: `@NotBlank`, `@Email`
- `password`: `@NotBlank`, `@Size(min=8, max=72)`

## LoginResponse
```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGciOi...",
  "expiresIn": 1800,
  "user": {
    "userId": "cab5...",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

## AuthExceptionHandler 추가
```java
@ExceptionHandler(InvalidCredentialsException.class)
public ResponseEntity<ErrorResponse> handleInvalidCredentials(...) {
  return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
      .body(ErrorResponse.of("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다."));
}
```

## 완료 기준
- Swagger 에서 `POST /api/auth/login` 200 / 401 동작 확인
- 가입한 계정으로 토큰 문자열 받는 것 확인
- `/api/users` 는 여전히 permitAll (다음 스텝에서 잠금)
