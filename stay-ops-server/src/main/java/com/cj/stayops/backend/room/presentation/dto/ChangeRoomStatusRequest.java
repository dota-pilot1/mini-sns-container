package com.cj.stayops.backend.room.presentation.dto;

import com.cj.stayops.backend.room.application.dto.ChangeRoomStatusCommand;
import com.cj.stayops.backend.room.domain.model.RoomStatus;

import jakarta.validation.constraints.NotNull;

public record ChangeRoomStatusRequest(
	@NotNull RoomStatus status
) {
	public ChangeRoomStatusCommand toCommand(String roomId) {
		return new ChangeRoomStatusCommand(roomId, status);
	}
}
