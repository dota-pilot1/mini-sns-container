package com.cj.stayops.backend.auth.application.dto;

/**
 * 회원가입 유스케이스 입력 DTO.
 * <p>
 * Presentation Layer의 {@code SignupRequest}에서 변환되어 전달된다.
 * raw password를 담으며, UseCase 내부에서 해싱된다.
 */
public record SignupCommand(
	String email,
	String rawPassword,
	String name
) {
}
