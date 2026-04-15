package com.cj.stayops.backend.user.domain.exception;

/**
 * 이미 존재하는 이메일로 User를 생성하려 할 때 발생.
 * <p>
 * Application Layer에서 UserRepository 조회 후 throw.
 */
public class DuplicateEmailException extends RuntimeException {

	public DuplicateEmailException(String email) {
		super("Email already exists: " + email);
	}
}
