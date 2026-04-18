package com.cj.stayops.backend.room.application.dto;

import java.math.BigDecimal;
import java.util.Set;

import com.cj.stayops.backend.room.domain.model.RoomOption;
import com.cj.stayops.backend.room.domain.model.RoomType;

/**
 * PATCH 시맨틱 — null 필드는 변경 없음.
 */
public record UpdateRoomCommand(
	String roomId,
	String roomNumber,
	Integer floor,
	BigDecimal sizePyeong,
	RoomType roomType,
	Long monthlyRent,
	Long deposit,
	Set<RoomOption> options,
	String memo
) { }
