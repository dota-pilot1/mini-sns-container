package com.cj.stayops.backend.auth.presentation.dto;

import java.time.Instant;

import com.cj.stayops.backend.auth.application.dto.SignupResult;

/**
 * 회원가입 API 응답 DTO.
 */
public record SignupResponse(
	String userId,
	String email,
	String name,
	Instant createdAt
) {

	public static SignupResponse from(SignupResult result) {
		return new SignupResponse(
			result.userId(),
			result.email(),
			result.name(),
			result.createdAt()
		);
	}
}
