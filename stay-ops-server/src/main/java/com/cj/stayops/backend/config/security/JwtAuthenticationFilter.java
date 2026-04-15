package com.cj.stayops.backend.config.security;

import java.io.IOException;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.cj.stayops.backend.auth.domain.exception.ExpiredTokenException;
import com.cj.stayops.backend.auth.domain.exception.InvalidTokenException;
import com.cj.stayops.backend.auth.infrastructure.security.JwtAuthentication;
import com.cj.stayops.backend.auth.infrastructure.security.JwtTokenProvider;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 요청마다 {@code Authorization: Bearer <token>} 헤더를 검사해 SecurityContext 에
 * 인증 정보를 채워주는 필터.
 *
 * <h3>원칙</h3>
 * <ul>
 *   <li><b>예외를 응답으로 바꾸지 않는다.</b> 검증 실패 시 SecurityContext 를 비워둔 채 체인 계속.
 *       → 실제 401 응답은 {@link RestAuthenticationEntryPoint} 가 담당.</li>
 *   <li><b>멱등.</b> 이미 SecurityContext 에 인증이 있으면 건드리지 않음.</li>
 *   <li><b>헤더 없음은 정상 케이스.</b> permitAll 엔드포인트(/api/auth/**, /swagger-ui 등)는
 *       토큰 없이도 접근하므로 여기서 막지 않는다. 보호 엔드포인트 판정은 뒤쪽 인가 필터의 몫.</li>
 * </ul>
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final String AUTH_HEADER = "Authorization";
	private static final String BEARER_PREFIX = "Bearer ";

	private final JwtTokenProvider jwtTokenProvider;

	public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
		this.jwtTokenProvider = jwtTokenProvider;
	}

	@Override
	protected void doFilterInternal(@NonNull HttpServletRequest request,
									@NonNull HttpServletResponse response,
									@NonNull FilterChain chain) throws ServletException, IOException {
		// 이미 인증 있음 → 멱등 보장
		if (SecurityContextHolder.getContext().getAuthentication() != null) {
			chain.doFilter(request, response);
			return;
		}

		String token = extractToken(request);
		if (token != null) {
			try {
				JwtAuthentication principal = jwtTokenProvider.authenticate(token);
				// principal 만 담고 credentials 는 null. 권한은 v2 에서 role 도입 시 추가.
				UsernamePasswordAuthenticationToken auth =
					new UsernamePasswordAuthenticationToken(principal, null, List.of());
				SecurityContextHolder.getContext().setAuthentication(auth);
			} catch (ExpiredTokenException | InvalidTokenException e) {
				// 실패는 조용히 무시 → SecurityContext 는 비어있는 상태로 체인 계속.
				// 보호 엔드포인트면 뒤쪽 인가 필터가 EntryPoint 를 발동시켜 401 내림.
				SecurityContextHolder.clearContext();
			}
		}

		chain.doFilter(request, response);
	}

	/**
	 * {@code Authorization: Bearer <token>} 에서 토큰 부분만 추출.
	 * 헤더 없음 / 포맷 불일치 → null.
	 */
	private String extractToken(HttpServletRequest request) {
		String header = request.getHeader(AUTH_HEADER);
		if (header == null || !header.startsWith(BEARER_PREFIX)) {
			return null;
		}
		String token = header.substring(BEARER_PREFIX.length()).trim();
		return token.isEmpty() ? null : token;
	}
}
