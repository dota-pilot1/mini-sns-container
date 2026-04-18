package com.cj.stayops.backend.tenant.application.dto;

import java.time.LocalDate;

public record CreateTenantCommand(
	String name,
	String phoneNumber,
	String roomId,       // nullable UUID 문자열 — 입주 예약 단계라 방 미배정 가능
	LocalDate moveInDate, // nullable
	String memo           // nullable
) { }
