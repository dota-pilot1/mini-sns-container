package com.cj.stayops.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.cj.stayops.backend.auth.infrastructure.security.JwtAuthentication;
import com.cj.stayops.backend.auth.infrastructure.security.JwtProperties;
import com.cj.stayops.backend.auth.infrastructure.security.JwtTokenProvider;
import com.cj.stayops.backend.user.domain.model.Email;
import com.cj.stayops.backend.user.domain.model.UserId;

class JwtAuthenticationFilterTest {

	private static final String SECRET =
		"test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
	private static final long TTL = 1800L;
	private static final String ISSUER = "stay-ops-test";
	private static final Instant FIXED_NOW = Instant.parse("2026-04-16T10:00:00Z");

	private JwtTokenProvider provider;
	private JwtAuthenticationFilter filter;

	@BeforeEach
	void setUp() {
		Clock clock = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
		provider = new JwtTokenProvider(new JwtProperties(SECRET, TTL, ISSUER), clock);
		filter = new JwtAuthenticationFilter(provider);
		SecurityContextHolder.clearContext();
	}

	@AfterEach
	void tearDown() {
		SecurityContextHolder.clearContext();
	}

	@Test
	@DisplayName("유효한 Bearer 토큰 → SecurityContext 에 JwtAuthentication 세팅")
	void valid_token_sets_security_context() throws Exception {
		UserId userId = UserId.generate();
		Email email = Email.of("user@example.com");
		String token = provider.issue(userId, email, FIXED_NOW);

		MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/users");
		req.addHeader("Authorization", "Bearer " + token);
		MockHttpServletResponse res = new MockHttpServletResponse();
		MockFilterChain chain = new MockFilterChain();

		filter.doFilter(req, res, chain);

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		assertThat(authentication).isNotNull();
		assertThat(authentication.getPrincipal()).isInstanceOf(JwtAuthentication.class);

		JwtAuthentication principal = (JwtAuthentication) authentication.getPrincipal();
		assertThat(principal.userId()).isEqualTo(userId);
		assertThat(principal.email()).isEqualTo(email);
	}

	@Test
	@DisplayName("만료된 토큰 → SecurityContext 비어있는 채로 체인 계속")
	void expired_token_leaves_context_empty() throws Exception {
		// 발급은 FIXED_NOW 기준
		String token = provider.issue(UserId.generate(), Email.of("u@e.com"), FIXED_NOW);

		// 검증 시점은 TTL 훨씬 지난 미래 → 만료
		Clock future = Clock.fixed(FIXED_NOW.plusSeconds(TTL + 60), ZoneOffset.UTC);
		JwtTokenProvider futureProvider =
			new JwtTokenProvider(new JwtProperties(SECRET, TTL, ISSUER), future);
		JwtAuthenticationFilter futureFilter = new JwtAuthenticationFilter(futureProvider);

		MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/users");
		req.addHeader("Authorization", "Bearer " + token);
		MockHttpServletResponse res = new MockHttpServletResponse();
		MockFilterChain chain = new MockFilterChain();

		futureFilter.doFilter(req, res, chain);

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
		// 응답은 건드리지 않음 → 상태 200 기본값 유지, 체인은 계속 진행
		assertThat(res.getStatus()).isEqualTo(200);
	}

	@Test
	@DisplayName("Authorization 헤더 없음 → 그냥 통과, SecurityContext 비어있음")
	void no_header_passes_through() throws Exception {
		MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/auth/login");
		MockHttpServletResponse res = new MockHttpServletResponse();
		MockFilterChain chain = new MockFilterChain();

		filter.doFilter(req, res, chain);

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
		assertThat(res.getStatus()).isEqualTo(200);
	}
}
