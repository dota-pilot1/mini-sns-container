package com.cj.stayops.backend.room.application.dto;

import java.time.Instant;

import com.cj.stayops.backend.room.domain.model.RoomImage;

public record RoomImageResult(
	String id,
	String roomId,
	String s3Key,
	String contentType,
	long sizeBytes,
	int sortOrder,
	boolean primary,
	Instant createdAt
) {
	public static RoomImageResult from(RoomImage image) {
		return new RoomImageResult(
			image.id().asString(),
			image.roomId().asString(),
			image.s3Key(),
			image.contentType(),
			image.sizeBytes(),
			image.sortOrder(),
			image.isPrimary(),
			image.createdAt()
		);
	}
}
