package com.cj.stayops.backend.room.presentation.dto;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Set;

import com.cj.stayops.backend.room.application.dto.CreateRoomCommand;
import com.cj.stayops.backend.room.domain.model.RoomOption;
import com.cj.stayops.backend.room.domain.model.RoomType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateRoomRequest(
	@NotBlank @Size(max = 10) String roomNumber,
	@NotNull @Min(-5) @Max(50) Integer floor,
	@NotNull @DecimalMin(value = "0.1") BigDecimal sizePyeong,
	@NotNull RoomType roomType,
	@NotNull @Min(0) Long monthlyRent,
	@NotNull @Min(0) Long deposit,
	Set<RoomOption> options,
	@Size(max = 500) String memo
) {
	public CreateRoomCommand toCommand() {
		Set<RoomOption> opts = options == null ? EnumSet.noneOf(RoomOption.class) : options;
		return new CreateRoomCommand(
			roomNumber,
			floor,
			sizePyeong,
			roomType,
			monthlyRent,
			deposit,
			opts,
			memo
		);
	}
}
