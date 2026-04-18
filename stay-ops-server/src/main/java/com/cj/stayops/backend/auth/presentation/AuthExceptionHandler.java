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
import com.cj.stayops.backend.contract.domain.exception.ContractNotFoundException;
import com.cj.stayops.backend.contract.domain.exception.InvalidContractFieldException;
import com.cj.stayops.backend.room.domain.exception.DuplicateRoomNumberException;
import com.cj.stayops.backend.room.domain.exception.InvalidRoomFieldException;
import com.cj.stayops.backend.room.domain.exception.RoomNotFoundException;
import com.cj.stayops.backend.tenant.domain.exception.InvalidTenantFieldException;
import com.cj.stayops.backend.tenant.domain.exception.TenantNotFoundException;
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

	/** 방 필드 도메인 검증 실패 → 400 Bad Request. */
	@ExceptionHandler(InvalidRoomFieldException.class)
	public ResponseEntity<ErrorResponse> handleInvalidRoomField(InvalidRoomFieldException e) {
		List<ErrorResponse.FieldError> errors = List.of(
			new ErrorResponse.FieldError(e.field(), e.getMessage())
		);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(ErrorResponse.of("INVALID_ROOM_FIELD", e.getMessage(), errors));
	}

	/** 호수 중복 → 409 Conflict. */
	@ExceptionHandler(DuplicateRoomNumberException.class)
	public ResponseEntity<ErrorResponse> handleDuplicateRoomNumber(DuplicateRoomNumberException e) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
			.body(ErrorResponse.of("DUPLICATE_ROOM_NUMBER", e.getMessage()));
	}

	/** 존재하지 않는 방 → 404 Not Found. */
	@ExceptionHandler(RoomNotFoundException.class)
	public ResponseEntity<ErrorResponse> handleRoomNotFound(RoomNotFoundException e) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
			.body(ErrorResponse.of("ROOM_NOT_FOUND", e.getMessage()));
	}

	/** 입주자 필드 도메인 검증 실패 → 400 Bad Request. */
	@ExceptionHandler(InvalidTenantFieldException.class)
	public ResponseEntity<ErrorResponse> handleInvalidTenantField(InvalidTenantFieldException e) {
		List<ErrorResponse.FieldError> errors = List.of(
			new ErrorResponse.FieldError(e.field(), e.getMessage())
		);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(ErrorResponse.of("INVALID_TENANT_FIELD", e.getMessage(), errors));
	}

	/** 존재하지 않는 입주자 → 404 Not Found. */
	@ExceptionHandler(TenantNotFoundException.class)
	public ResponseEntity<ErrorResponse> handleTenantNotFound(TenantNotFoundException e) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
			.body(ErrorResponse.of("TENANT_NOT_FOUND", e.getMessage()));
	}

	/** 계약 필드 도메인 검증 실패 → 400 Bad Request. */
	@ExceptionHandler(InvalidContractFieldException.class)
	public ResponseEntity<ErrorResponse> handleInvalidContractField(InvalidContractFieldException e) {
		List<ErrorResponse.FieldError> errors = List.of(
			new ErrorResponse.FieldError(e.field(), e.getMessage())
		);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(ErrorResponse.of("INVALID_CONTRACT_FIELD", e.getMessage(), errors));
	}

	/** 존재하지 않는 계약 → 404 Not Found. */
	@ExceptionHandler(ContractNotFoundException.class)
	public ResponseEntity<ErrorResponse> handleContractNotFound(ContractNotFoundException e) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
			.body(ErrorResponse.of("CONTRACT_NOT_FOUND", e.getMessage()));
	}
}
