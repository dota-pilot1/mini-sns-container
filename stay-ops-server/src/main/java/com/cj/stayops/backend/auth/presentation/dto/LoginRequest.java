package com.cj.stayops.backend.auth.presentation.dto;

import com.cj.stayops.backend.auth.application.dto.LoginCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 로그인 API 요청 DTO.
 * <p>
 * Bean Validation 으로 1차 형식 검증. 도메인 규칙(Email 정규식 등)은
 * Application/Domain 에서 재검증된다.
 */
@Schema(description = "로그인 요청")
public record LoginRequest(

	@Schema(description = "이메일", example = "user@example.com", maxLength = 254)
	@NotBlank(message = "email must not be blank")
	@Email(message = "email format is invalid")
	@Size(max = 254, message = "email must not exceed 254 characters")
	String email,

	@Schema(description = "비밀번호", example = "password123", minLength = 8, maxLength = 72)
	@NotBlank(message = "password must not be blank")
	@Size(min = 8, max = 72, message = "password must be between 8 and 72 characters")
	String password
) {

	public LoginCommand toCommand() {
		return new LoginCommand(email, password);
	}
}
