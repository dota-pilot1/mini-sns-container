package com.cj.stayops.backend.auth.presentation.dto;

import java.time.Instant;
import java.util.List;

/**
 * 에러 응답 DTO (auth 모듈 로컬).
 * <p>
 * TODO: 전역 응답/에러 규격 도입 시 {@code shared/presentation}으로 승격.
 */
public record ErrorResponse(
	String code,
	String message,
	List<FieldError> errors,
	Instant timestamp
) {

	public static ErrorResponse of(String code, String message) {
		return new ErrorResponse(code, message, List.of(), Instant.now());
	}

	public static ErrorResponse of(String code, String message, List<FieldError> errors) {
		return new ErrorResponse(code, message, errors, Instant.now());
	}

	public record FieldError(String field, String message) {
	}
}
