package com.cj.stayops.backend.auth.presentation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cj.stayops.backend.auth.application.SignupUseCase;
import com.cj.stayops.backend.auth.application.dto.SignupResult;
import com.cj.stayops.backend.auth.presentation.dto.ErrorResponse;
import com.cj.stayops.backend.auth.presentation.dto.SignupRequest;
import com.cj.stayops.backend.auth.presentation.dto.SignupResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * 인증 관련 API Controller.
 * <p>
 * UseCase 호출에만 집중하고, 도메인 규칙은 포함하지 않는다 (Thin Controller).
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth", description = "인증/회원가입 API")
public class AuthController {

	private final SignupUseCase signupUseCase;

	public AuthController(SignupUseCase signupUseCase) {
		this.signupUseCase = signupUseCase;
	}

	@PostMapping("/signup")
	@Operation(
		summary = "회원가입",
		description = "이메일/비밀번호/이름을 받아 신규 사용자를 등록합니다."
	)
	@ApiResponses({
		@ApiResponse(
			responseCode = "201",
			description = "가입 성공",
			content = @Content(schema = @Schema(implementation = SignupResponse.class))
		),
		@ApiResponse(
			responseCode = "400",
			description = "형식 오류 (VALIDATION_FAILED / INVALID_EMAIL / WEAK_PASSWORD)",
			content = @Content(schema = @Schema(implementation = ErrorResponse.class))
		),
		@ApiResponse(
			responseCode = "409",
			description = "이메일 중복 (DUPLICATE_EMAIL)",
			content = @Content(schema = @Schema(implementation = ErrorResponse.class))
		)
	})
	public ResponseEntity<SignupResponse> signup(@Valid @RequestBody SignupRequest request) {
		SignupResult result = signupUseCase.execute(request.toCommand());
		return ResponseEntity.status(HttpStatus.CREATED).body(SignupResponse.from(result));
	}
}
