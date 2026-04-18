package com.cj.stayops.backend.room.application.dto;

import com.cj.stayops.backend.room.domain.model.RoomStatus;

public record ChangeRoomStatusCommand(
	String roomId,
	RoomStatus newStatus
) { }
