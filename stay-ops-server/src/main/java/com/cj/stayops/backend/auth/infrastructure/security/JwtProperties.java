package com.cj.stayops.backend.auth.infrastructure.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * {@code app.jwt.*} 프로퍼티 바인딩.
 * <p>
 * application.yaml 의 {@code app.jwt} 블록을 타입 안전하게 매핑한다.
 */
@ConfigurationProperties("app.jwt")
public record JwtProperties(
	String secret,
	long accessTokenTtlSeconds,
	String issuer
) {
}
