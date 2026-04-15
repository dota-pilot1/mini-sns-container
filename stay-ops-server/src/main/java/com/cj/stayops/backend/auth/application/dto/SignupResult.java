package com.cj.stayops.backend.auth.application.dto;

import java.time.Instant;

import com.cj.stayops.backend.user.domain.model.User;

/**
 * 회원가입 유스케이스 출력 DTO.
 * <p>
 * JWT 토큰 발급은 로그인 유스케이스에서 담당한다 (회원가입 ≠ 로그인).
 */
public record SignupResult(
	String userId,
	String email,
	String name,
	Instant createdAt
) {

	public static SignupResult from(User user) {
		return new SignupResult(
			user.id().asString(),
			user.email().value(),
			user.name(),
			user.createdAt()
		);
	}
}
