package com.cj.stayops.backend.config.security;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 미인증 요청이 보호 엔드포인트에 접근했을 때 JSON 401 을 내려주는 EntryPoint.
 * <p>
 * 응답 예시:
 * <pre>
 * {
 *   "code": "UNAUTHENTICATED",
 *   "message": "Authentication required",
 *   "errors": [],
 *   "timestamp": "2026-04-16T10:00:00Z"
 * }
 * </pre>
 * <p>
 * 응답 형태가 고정이라 ObjectMapper 의존 없이 수동 직렬화. 의존성 축소 + 테스트 컨텍스트
 * 호환성 확보.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

	@Override
	public void commence(HttpServletRequest request,
						 HttpServletResponse response,
						 AuthenticationException authException) throws IOException {
		response.setStatus(HttpStatus.UNAUTHORIZED.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding("UTF-8");

		String json = String.format(
			"{\"code\":\"UNAUTHENTICATED\",\"message\":\"Authentication required\",\"errors\":[],\"timestamp\":\"%s\"}",
			Instant.now()
		);
		try (PrintWriter writer = response.getWriter()) {
			writer.write(json);
		}
	}
}
