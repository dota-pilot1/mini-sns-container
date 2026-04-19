package com.cj.stayops.backend.room.application.dto;

import java.math.BigDecimal;
import java.util.Set;

import com.cj.stayops.backend.room.domain.model.RoomOption;

public record CreateRoomCommand(
	String roomNumber,
	int floor,
	BigDecimal sizePyeong,
	long monthlyRent,
	long deposit,
	Set<RoomOption> options,
	String memo
) { }
