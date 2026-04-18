package com.cj.stayops.backend.tenant.presentation.dto;

import java.time.LocalDate;

import com.cj.stayops.backend.tenant.application.dto.UpdateTenantCommand;

import jakarta.validation.constraints.Size;

/**
 * PATCH 시맨틱 — null 필드는 변경 없음.
 * <p>
 * roomId 는 "변경 없음" 과 "해제" 를 구분하기 위해 {@link #clearRoom} 플래그 병용.
 * clearRoom=true 면 roomId 는 무시되고 방 연결이 해제된다.
 */
public record UpdateTenantRequest(
	@Size(max = 50) String name,
	String phoneNumber,
	String roomId,
	boolean clearRoom,
	LocalDate moveInDate,
	LocalDate moveOutDate,
	@Size(max = 500) String memo
) {
	public UpdateTenantCommand toCommand(String tenantId) {
		return new UpdateTenantCommand(
			tenantId, name, phoneNumber, roomId, clearRoom,
			moveInDate, moveOutDate, memo
		);
	}
}
