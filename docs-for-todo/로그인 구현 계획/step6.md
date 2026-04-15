# Step 6. `/api/users/**` 보호 전환

## 수정 파일
`config/SecurityConfig.java`

## 변경 내용
```java
http
  .cors(Customizer.withDefaults())
  .csrf(csrf -> csrf.disable())
  .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
  .authorizeHttpRequests(authorize -> authorize
      .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
      .requestMatchers("/api/auth/**").permitAll()
      .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
      // ⬇️ 변경: permitAll 제거, 인증 필요
      .requestMatchers("/api/users/**").authenticated()
      .anyRequest().authenticated()
  )
  .exceptionHandling(eh -> eh.authenticationEntryPoint(restAuthenticationEntryPoint))
  .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
  .httpBasic(h -> h.disable())     // JWT 만 쓰므로 제거
  .formLogin(f -> f.disable());    // 동일
```

## 왜 Stateless?
JWT 는 서버 세션을 쓰지 않음. Spring Security 가 자동으로 세션 만드는 걸 막아 CSRF/세션 고정 이슈를 원천 차단.

## 검증 시나리오
- `GET /api/users` without token → 401 `UNAUTHENTICATED`
- `GET /api/users` with expired token → 401
- `GET /api/users` with valid token → 200
- `POST /api/auth/login` without token → 여전히 200 (permitAll)
- `POST /api/auth/signup` without token → 여전히 201

## 완료 기준
Swagger 에서 "Authorize" 버튼으로 Bearer 토큰 넣고 `/api/users` 호출 시 성공, 빼면 401.
