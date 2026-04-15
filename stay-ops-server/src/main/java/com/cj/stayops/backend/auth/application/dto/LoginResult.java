package com.cj.stayops.backend.auth.application.dto;

/**
 * 로그인 유스케이스 출력 DTO.
 * <p>
 * 프론트가 그대로 받아 {@code Authorization: Bearer <accessToken>} 헤더 구성에 사용.
 */
public record LoginResult(
	String accessToken,
	String tokenType,       // 항상 "Bearer"
	long expiresIn,         // 초 단위 (yaml 의 access-token-ttl-seconds)
	String userId,
	String email,
	String name
) {
}
