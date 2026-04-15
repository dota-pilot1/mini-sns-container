package com.cj.stayops.backend.auth.presentation.dto;

import com.cj.stayops.backend.auth.application.dto.LoginResult;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 로그인 API 응답 DTO.
 * <p>
 * <pre>
 * {
 *   "tokenType": "Bearer",
 *   "accessToken": "eyJhbGciOi...",
 *   "expiresIn": 1800,
 *   "user": { "userId": "...", "email": "...", "name": "..." }
 * }
 * </pre>
 */
@Schema(description = "로그인 응답")
public record LoginResponse(

	@Schema(description = "토큰 타입", example = "Bearer")
	String tokenType,

	@Schema(description = "Access Token (JWT)", example = "eyJhbGciOi...")
	String accessToken,

	@Schema(description = "만료 시간(초)", example = "1800")
	long expiresIn,

	@Schema(description = "로그인한 사용자 정보")
	User user
) {

	public static LoginResponse from(LoginResult result) {
		return new LoginResponse(
			result.tokenType(),
			result.accessToken(),
			result.expiresIn(),
			new User(result.userId(), result.email(), result.name())
		);
	}

	@Schema(description = "사용자 정보")
	public record User(
		@Schema(description = "사용자 ID (UUID)", example = "b3e1f0f4-...")
		String userId,

		@Schema(description = "이메일", example = "user@example.com")
		String email,

		@Schema(description = "이름", example = "홍길동")
		String name
	) {
	}
}
