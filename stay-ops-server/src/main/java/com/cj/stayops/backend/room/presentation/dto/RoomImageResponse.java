package com.cj.stayops.backend.room.presentation.dto;

import java.time.Instant;

import com.cj.stayops.backend.config.aws.S3ObjectService;
import com.cj.stayops.backend.room.application.dto.RoomImageResult;

public record RoomImageResponse(
	String id,
	String roomId,
	String url,
	String contentType,
	long sizeBytes,
	int sortOrder,
	boolean primary,
	Instant createdAt
) {
	public static RoomImageResponse from(RoomImageResult r, S3ObjectService s3) {
		return new RoomImageResponse(
			r.id(),
			r.roomId(),
			s3.presignGetUrl(r.s3Key()),
			r.contentType(),
			r.sizeBytes(),
			r.sortOrder(),
			r.primary(),
			r.createdAt()
		);
	}
}
