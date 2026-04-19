package com.cj.stayops.backend.room.application.dto;

import com.cj.stayops.backend.room.domain.model.RoomStatus;

/**
 * 방 목록 필터. 모든 필드 nullable (null = 필터링 안 함).
 */
public record ListRoomsQuery(
	Integer floor,
	RoomStatus status
) { }
