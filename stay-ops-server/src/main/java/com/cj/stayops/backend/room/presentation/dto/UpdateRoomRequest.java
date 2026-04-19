package com.cj.stayops.backend.room.presentation.dto;

import java.math.BigDecimal;
import java.util.Set;

import com.cj.stayops.backend.room.application.dto.UpdateRoomCommand;
import com.cj.stayops.backend.room.domain.model.RoomOption;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * PATCH 시맨틱 — null 필드는 변경 없음.
 */
public record UpdateRoomRequest(
	@Size(min = 1, max = 10) String roomNumber,
	@Min(-5) @Max(50) Integer floor,
	@DecimalMin(value = "0.1") BigDecimal sizePyeong,
	@Min(0) Long monthlyRent,
	@Min(0) Long deposit,
	Set<RoomOption> options,
	@Size(max = 500) String memo
) {
	public UpdateRoomCommand toCommand(String roomId) {
		return new UpdateRoomCommand(
			roomId,
			roomNumber,
			floor,
			sizePyeong,
			monthlyRent,
			deposit,
			options,
			memo
		);
	}
}
