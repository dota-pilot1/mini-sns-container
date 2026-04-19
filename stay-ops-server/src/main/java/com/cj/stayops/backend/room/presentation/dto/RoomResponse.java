package com.cj.stayops.backend.room.presentation.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

import com.cj.stayops.backend.room.application.dto.RoomResult;
import com.cj.stayops.backend.room.domain.model.RoomOption;
import com.cj.stayops.backend.room.domain.model.RoomStatus;

public record RoomResponse(
	String roomId,
	String roomNumber,
	int floor,
	BigDecimal sizePyeong,
	long monthlyRent,
	long deposit,
	RoomStatus status,
	Set<RoomOption> options,
	String memo,
	/** 목록용 대표 이미지 presigned GET URL. 상세 엔드포인트에선 null. */
	String primaryImageUrl,
	Instant createdAt,
	Instant updatedAt
) {
	public static RoomResponse from(RoomResult r) {
		return from(r, null);
	}

	public static RoomResponse from(RoomResult r, String primaryImageUrl) {
		return new RoomResponse(
			r.roomId(), r.roomNumber(), r.floor(), r.sizePyeong(),
			r.monthlyRent(), r.deposit(), r.status(), r.options(), r.memo(),
			primaryImageUrl,
			r.createdAt(), r.updatedAt()
		);
	}
}
