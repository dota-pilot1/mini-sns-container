package com.cj.stayops.backend.auth.domain.exception;

/**
 * 로그인 자격 증명 실패.
 * <p>
 * 보안상 "존재하지 않는 이메일" 과 "비밀번호 불일치" 를 구분하지 않고
 * 동일한 예외로 던진다 → 계정 존재 여부 유출 방지.
 */
public class InvalidCredentialsException extends RuntimeException {

	public InvalidCredentialsException(String message) {
		super(message);
	}
}
