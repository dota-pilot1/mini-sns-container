package com.cj.stayops.backend.auth.domain.exception;

/**
 * Email Value Object 생성 시 형식이 잘못되었을 때 발생.
 */
public class InvalidEmailException extends RuntimeException {

	public InvalidEmailException(String message) {
		super(message);
	}
}
