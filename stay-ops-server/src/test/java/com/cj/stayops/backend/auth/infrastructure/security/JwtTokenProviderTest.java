package com.cj.stayops.backend.auth.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.cj.stayops.backend.auth.domain.exception.ExpiredTokenException;
import com.cj.stayops.backend.auth.domain.exception.InvalidTokenException;
import com.cj.stayops.backend.user.domain.model.Email;
import com.cj.stayops.backend.user.domain.model.UserId;

import io.jsonwebtoken.Claims;

class JwtTokenProviderTest {

	// HS256 에 필요한 최소 32바이트를 여유있게 넘긴 테스트용 시크릿.
	private static final String SECRET_A =
		"test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
	private static final String SECRET_B =
		"test-secret-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
	private static final long TTL_SECONDS = 1800L;
	private static final String ISSUER = "stay-ops-test";

	private static final Instant FIXED_NOW = Instant.parse("2026-04-16T10:00:00Z");

	private JwtTokenProvider providerWith(String secret, Clock clock) {
		JwtProperties props = new JwtProperties(secret, TTL_SECONDS, ISSUER);
		return new JwtTokenProvider(props, clock);
	}

	@Test
	@DisplayName("발급 후 검증하면 sub/email 이 정상 복원된다")
	void issue_then_verify_returns_original_claims() {
		Clock clock = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
		JwtTokenProvider provider = providerWith(SECRET_A, clock);

		UserId userId = UserId.generate();
		Email email = Email.of("user@example.com");

		String token = provider.issue(userId, email, FIXED_NOW);
		Claims claims = provider.verify(token);

		assertThat(claims.getSubject()).isEqualTo(userId.asString());
		assertThat(claims.get("email", String.class)).isEqualTo(email.value());
		assertThat(claims.getIssuer()).isEqualTo(ISSUER);
		assertThat(claims.getIssuedAt().toInstant()).isEqualTo(FIXED_NOW);
		assertThat(claims.getExpiration().toInstant())
			.isEqualTo(FIXED_NOW.plusSeconds(TTL_SECONDS));
	}

	@Test
	@DisplayName("만료 시간이 지난 토큰은 ExpiredTokenException 을 던진다")
	void expired_token_throws_ExpiredTokenException() {
		// 발급 시점 Clock
		Clock issuingClock = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
		JwtTokenProvider issuer = providerWith(SECRET_A, issuingClock);
		String token = issuer.issue(UserId.generate(), Email.of("user@example.com"), FIXED_NOW);

		// 검증 시점: TTL 을 훨씬 넘긴 미래
		Instant future = FIXED_NOW.plusSeconds(TTL_SECONDS + 60);
		Clock verifyingClock = Clock.fixed(future, ZoneOffset.UTC);
		JwtTokenProvider verifier = providerWith(SECRET_A, verifyingClock);

		assertThatThrownBy(() -> verifier.verify(token))
			.isInstanceOf(ExpiredTokenException.class);
	}

	@Test
	@DisplayName("다른 시크릿으로 서명된 토큰은 InvalidTokenException 을 던진다")
	void wrong_secret_throws_InvalidTokenException() {
		Clock clock = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
		JwtTokenProvider signer = providerWith(SECRET_A, clock);
		JwtTokenProvider verifier = providerWith(SECRET_B, clock);

		String token = signer.issue(UserId.generate(), Email.of("user@example.com"), FIXED_NOW);

		assertThatThrownBy(() -> verifier.verify(token))
			.isInstanceOf(InvalidTokenException.class);
	}
}
