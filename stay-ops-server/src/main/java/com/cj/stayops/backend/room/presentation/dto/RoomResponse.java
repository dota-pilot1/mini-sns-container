package com.cj.stayops.backend.room.presentation.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

import com.cj.stayops.backend.room.application.dto.RoomResult;
import com.cj.stayops.backend.room.domain.model.RoomOption;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.model.RoomType;

public record RoomResponse(
	String roomId,
	String roomNumber,
	int floor,
	BigDecimal sizePyeong,
	RoomType roomType,
	long monthlyRent,
	long deposit,
	RoomStatus status,
	Set<RoomOption> options,
	String memo,
	Instant createdAt,
	Instant updatedAt
) {
	public static RoomResponse from(RoomResult r) {
		return new RoomResponse(
			r.roomId(), r.roomNumber(), r.floor(), r.sizePyeong(), r.roomType(),
			r.monthlyRent(), r.deposit(), r.status(), r.options(), r.memo(),
			r.createdAt(), r.updatedAt()
		);
	}
}
