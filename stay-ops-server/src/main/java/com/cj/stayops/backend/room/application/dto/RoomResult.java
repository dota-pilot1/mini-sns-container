package com.cj.stayops.backend.room.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomOption;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.model.RoomType;

public record RoomResult(
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
	public static RoomResult from(Room room) {
		return new RoomResult(
			room.id().asString(),
			room.roomNumber().value(),
			room.floor(),
			room.sizePyeong(),
			room.roomType(),
			room.monthlyRent().amount(),
			room.deposit().amount(),
			room.status(),
			room.options().isEmpty()
				? EnumSet.noneOf(RoomOption.class)
				: EnumSet.copyOf(room.options()),
			room.memo(),
			room.createdAt(),
			room.updatedAt()
		);
	}
}
