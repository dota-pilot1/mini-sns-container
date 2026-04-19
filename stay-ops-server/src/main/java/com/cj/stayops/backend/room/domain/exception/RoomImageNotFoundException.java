package com.cj.stayops.backend.room.domain.exception;

/** 존재하지 않는 RoomImage. → 404 Not Found. */
public class RoomImageNotFoundException extends RuntimeException {
	public RoomImageNotFoundException(String imageId) {
		super("Room image not found: " + imageId);
	}
}
