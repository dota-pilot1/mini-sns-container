package com.cj.stayops.backend.auth.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.cj.stayops.backend.auth.domain.exception.ExpiredTokenException;
import com.cj.stayops.backend.auth.domain.exception.InvalidTokenException;
import com.cj.stayops.backend.user.domain.model.Email;
import com.cj.stayops.backend.user.domain.model.UserId;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;

/**
 * JWT 발급/검증 전담 컴포넌트 (HS256).
 * <p>
 * - 알고리즘: HS256 대칭키<br>
 * - 클레임: {@code sub}(UserId), {@code email}, {@code iat}, {@code exp}, {@code iss}<br>
 * - 시간 의존성은 {@link Clock} 으로 주입 → 테스트에서 {@code Clock.fixed} 로 교체 가능.
 */
@Component
public class JwtTokenProvider {

	private final SecretKey key;
	private final long ttlSeconds;
	private final String issuer;
	private final Clock clock;

	public JwtTokenProvider(JwtProperties properties, Clock clock) {
		byte[] secretBytes = properties.secret().getBytes(StandardCharsets.UTF_8);
		// HS256 은 최소 32바이트(256비트) 필요. 짧으면 여기서 IllegalArgumentException 발생 → 부팅 실패.
		this.key = Keys.hmacShaKeyFor(secretBytes);
		this.ttlSeconds = properties.accessTokenTtlSeconds();
		this.issuer = properties.issuer();
		this.clock = clock;
	}

	/**
	 * Access Token 발급.
	 *
	 * @param userId sub 클레임에 들어갈 사용자 식별자
	 * @param email  email 클레임
	 * @param now    발급 시각 (iat). exp 는 now + ttl.
	 * @return 서명된 JWT 문자열
	 */
	public String issue(UserId userId, Email email, Instant now) {
		Instant expiresAt = now.plusSeconds(ttlSeconds);
		return Jwts.builder()
			.issuer(issuer)
			.subject(userId.asString())
			.claim("email", email.value())
			.issuedAt(Date.from(now))
			.expiration(Date.from(expiresAt))
			.signWith(key)
			.compact();
	}

	/**
	 * 주입된 {@link Clock} 을 기준으로 현재 시각을 사용해 발급.
	 */
	public String issue(UserId userId, Email email) {
		return issue(userId, email, Instant.now(clock));
	}

	/**
	 * 서명 + 만료 검증. 성공 시 payload Claims 반환.
	 *
	 * @throws ExpiredTokenException exp 지난 경우
	 * @throws InvalidTokenException 서명 불일치 / 포맷 손상 / 지원되지 않는 토큰 / null·blank
	 */
	public Claims verify(String token) {
		if (token == null || token.isBlank()) {
			throw new InvalidTokenException("Token must not be blank");
		}
		try {
			return Jwts.parser()
				.verifyWith(key)
				.clock(() -> Date.from(Instant.now(clock)))
				.build()
				.parseSignedClaims(token)
				.getPayload();
		} catch (ExpiredJwtException e) {
			throw new ExpiredTokenException("Token is expired", e);
		} catch (SignatureException | MalformedJwtException | UnsupportedJwtException | IllegalArgumentException e) {
			throw new InvalidTokenException("Invalid token: " + e.getMessage(), e);
		} catch (JwtException e) {
			// 혹시 모를 상위 예외 포괄 (sub-types 가 위에서 다 잡히지만 안전망).
			throw new InvalidTokenException("Invalid token: " + e.getMessage(), e);
		}
	}

	/**
	 * 검증 + principal 복원 헬퍼. step5 필터에서 주로 사용.
	 */
	public JwtAuthentication authenticate(String token) {
		Claims claims = verify(token);
		UserId userId = UserId.of(claims.getSubject());
		Email email = Email.of(claims.get("email", String.class));
		return new JwtAuthentication(userId, email);
	}
}
