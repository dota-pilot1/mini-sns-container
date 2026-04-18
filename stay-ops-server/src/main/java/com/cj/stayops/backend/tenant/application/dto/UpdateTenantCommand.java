package com.cj.stayops.backend.tenant.application.dto;

import java.time.LocalDate;

/**
 * PATCH 시맨틱 — null 필드는 변경 없음.
 * <p>
 * roomId 는 null 의미가 모호(해제 vs 변경없음)해 {@link #clearRoom} 플래그로 구분한다.
 * clearRoom=true 면 방 연결을 해제 (roomId 를 null 로). false 면 roomId 만 반영.
 */
public record UpdateTenantCommand(
	String tenantId,
	String name,
	String phoneNumber,
	String roomId,
	boolean clearRoom,
	LocalDate moveInDate,
	LocalDate moveOutDate,
	String memo
) { }
