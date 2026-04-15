package com.cj.stayops.backend.auth.domain.exception;

/**
 * 회원가입 시 이미 존재하는 이메일로 가입 시도할 때 발생.
 * <p>
 * Application Layer에서 UserRepository 조회 후 throw.
 */
public class DuplicateEmailException extends RuntimeException {

	public DuplicateEmailException(String email) {
		super("Email already exists: " + email);
	}
}
