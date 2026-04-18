package com.cj.stayops.backend.room.domain.exception;

/**
 * 존재하지 않는 Room 을 조회/변경/삭제하려 할 때 발생. → 404 Not Found.
 */
public class RoomNotFoundException extends RuntimeException {

	public RoomNotFoundException(String roomId) {
		super("Room not found: " + roomId);
	}
}
