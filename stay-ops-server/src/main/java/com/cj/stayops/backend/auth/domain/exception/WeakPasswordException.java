package com.cj.stayops.backend.auth.domain.exception;

/**
 * 비밀번호 정책을 만족하지 못할 때 발생.
 */
public class WeakPasswordException extends RuntimeException {

	public WeakPasswordException(String message) {
		super(message);
	}
}
