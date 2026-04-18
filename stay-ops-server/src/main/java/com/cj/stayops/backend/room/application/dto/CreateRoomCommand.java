package com.cj.stayops.backend.room.application.dto;

import java.math.BigDecimal;
import java.util.Set;

import com.cj.stayops.backend.room.domain.model.RoomOption;
import com.cj.stayops.backend.room.domain.model.RoomType;

public record CreateRoomCommand(
	String roomNumber,
	int floor,
	BigDecimal sizePyeong,
	RoomType roomType,
	long monthlyRent,
	long deposit,
	Set<RoomOption> options,
	String memo
) { }
