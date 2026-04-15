package com.cj.stayops.backend.auth.presentation;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.cj.stayops.backend.auth.domain.exception.DuplicateEmailException;
import com.cj.stayops.backend.auth.domain.exception.InvalidEmailException;
import com.cj.stayops.backend.auth.domain.exception.WeakPasswordException;
import com.cj.stayops.backend.auth.presentation.dto.ErrorResponse;

/**
 * Auth 모듈 전용 예외 핸들러 (basePackages로 스코프 제한).
 * <p>
 * TODO: 전역 에러 처리 도입 시 {@code shared/presentation/GlobalExceptionHandler}로 승격.
 * 지금은 auth 도메인 예외만 처리.
 */
@RestControllerAdvice(basePackages = "com.cj.stayops.backend.auth.presentation")
public class AuthExceptionHandler {

	/** Bean Validation 실패 (@Valid 통과 못함). */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
		List<ErrorResponse.FieldError> fieldErrors = e.getBindingResult().getFieldErrors().stream()
			.map(fe -> new ErrorResponse.FieldError(fe.getField(), fe.getDefaultMessage()))
			.toList();

		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(ErrorResponse.of("VALIDATION_FAILED", "Request validation failed", fieldErrors));
	}

	/** 이메일 중복 → 409 Conflict. */
	@ExceptionHandler(DuplicateEmailException.class)
	public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException e) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(ErrorResponse.of("DUPLICATE_EMAIL", e.getMessage()));
	}

	/** 이메일 형식 오류 → 400 Bad Request. */
	@ExceptionHandler(InvalidEmailException.class)
	public ResponseEntity<ErrorResponse> handleInvalidEmail(InvalidEmailException e) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(ErrorResponse.of("INVALID_EMAIL", e.getMessage()));
	}

	/** 비밀번호 정책 위반 → 400 Bad Request. */
	@ExceptionHandler(WeakPasswordException.class)
	public ResponseEntity<ErrorResponse> handleWeakPassword(WeakPasswordException e) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(ErrorResponse.of("WEAK_PASSWORD", e.getMessage()));
	}
}
