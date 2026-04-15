package com.cj.stayops.backend.auth.presentation.dto;

import com.cj.stayops.backend.auth.application.dto.SignupCommand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 회원가입 API 요청 DTO.
 * <p>
 * Bean Validation으로 1차 형식 검증을 수행한다.
 * 세부 도메인 규칙(Email 정규식, 비밀번호 정책)은 Application/Domain Layer에서 재검증.
 */
@Schema(description = "회원가입 요청")
public record SignupRequest(

	@Schema(description = "이메일 (로그인 아이디)", example = "user@example.com", maxLength = 254)
	@NotBlank(message = "email must not be blank")
	@Email(message = "email format is invalid")
	@Size(max = 254, message = "email must not exceed 254 characters")
	String email,

	@Schema(description = "비밀번호 (영문+숫자, 8~72자)", example = "password123", minLength = 8, maxLength = 72)
	@NotBlank(message = "password must not be blank")
	@Size(min = 8, max = 72, message = "password must be between 8 and 72 characters")
	String password,

	@Schema(description = "사용자 이름", example = "홍길동", maxLength = 100)
	@NotBlank(message = "name must not be blank")
	@Size(max = 100, message = "name must not exceed 100 characters")
	String name
) {

	public SignupCommand toCommand() {
		return new SignupCommand(email, password, name);
	}
}
