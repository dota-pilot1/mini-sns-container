package com.cj.stayops.backend.room.domain.exception;

/**
 * Room 필드 값이 도메인 제약을 위반했을 때 발생. → 400 Bad Request.
 */
public class InvalidRoomFieldException extends RuntimeException {

	private final String field;

	public InvalidRoomFieldException(String field, String message) {
		super(message);
		this.field = field;
	}

	public String field() {
		return field;
	}
}
