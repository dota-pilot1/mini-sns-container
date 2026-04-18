package com.cj.stayops.backend.room.domain.exception;

/**
 * 이미 존재하는 호수로 Room 을 생성/변경하려 할 때 발생. → 409 Conflict.
 */
public class DuplicateRoomNumberException extends RuntimeException {

	public DuplicateRoomNumberException(String roomNumber) {
		super("Room number already exists: " + roomNumber);
	}
}
