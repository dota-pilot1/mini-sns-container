package com.cj.stayops.backend.auth.presentation;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.cj.stayops.backend.auth.domain.exception.InvalidCredentialsException;
import com.cj.stayops.backend.auth.domain.exception.WeakPasswordException;
import com.cj.stayops.backend.auth.presentation.dto.ErrorResponse;
import com.cj.stayops.backend.user.domain.exception.DuplicateEmailException;
import com.cj.stayops.backend.user.domain.exception.InvalidEmailException;

/**
 * 전역 예외 핸들러.
 * <p>
 * auth/user 도메인 예외 + Bean Validation 실패를 일괄 처리한다.
 * 현재는 auth 패키지에 위치하지만, 도메인이 늘어나면
 * {@code shared/presentation/GlobalExceptionHandler}로 승격할 수 있다.
 */
@RestControllerAdvice
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

	/** 로그인 자격 증명 실패 → 401 Unauthorized. */
	@ExceptionHandler(InvalidCredentialsException.class)
	public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException e) {
		// e.getMessage() 는 디버깅용. 사용자에게는 일관된 메시지 반환 (계정 enumeration 방지).
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
			.body(ErrorResponse.of("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다."));
	}
}
