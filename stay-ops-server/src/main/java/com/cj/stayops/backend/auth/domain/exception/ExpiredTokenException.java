package com.cj.stayops.backend.auth.domain.exception;

/**
 * 토큰 만료(exp 지남) 시 발생.
 */
public class ExpiredTokenException extends RuntimeException {

	public ExpiredTokenException(String message) {
		super(message);
	}

	public ExpiredTokenException(String message, Throwable cause) {
		super(message, cause);
	}
}
