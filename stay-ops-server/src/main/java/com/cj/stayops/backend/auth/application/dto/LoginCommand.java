package com.cj.stayops.backend.auth.application.dto;

/**
 * 로그인 유스케이스 입력 DTO.
 * <p>
 * Presentation Layer의 {@code LoginRequest} 에서 변환되어 전달된다.
 */
public record LoginCommand(
	String email,
	String rawPassword
) {
}
