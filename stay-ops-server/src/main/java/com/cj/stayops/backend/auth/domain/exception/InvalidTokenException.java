package com.cj.stayops.backend.auth.domain.exception;

/**
 * 토큰 서명 불일치 / 포맷 손상 / 지원하지 않는 토큰 등에서 발생.
 */
public class InvalidTokenException extends RuntimeException {

	public InvalidTokenException(String message) {
		super(message);
	}

	public InvalidTokenException(String message, Throwable cause) {
		super(message, cause);
	}
}
