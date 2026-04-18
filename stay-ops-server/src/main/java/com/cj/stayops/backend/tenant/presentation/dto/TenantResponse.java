package com.cj.stayops.backend.tenant.presentation.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.cj.stayops.backend.tenant.application.dto.TenantResult;
import com.cj.stayops.backend.tenant.domain.model.TenantStatus;

public record TenantResponse(
	String tenantId,
	String name,
	String phoneNumber,
	String roomId,
	TenantStatus status,
	LocalDate moveInDate,
	LocalDate moveOutDate,
	String memo,
	Instant createdAt,
	Instant updatedAt
) {
	public static TenantResponse from(TenantResult r) {
		return new TenantResponse(
			r.tenantId(), r.name(), r.phoneNumber(), r.roomId(), r.status(),
			r.moveInDate(), r.moveOutDate(), r.memo(), r.createdAt(), r.updatedAt()
		);
	}
}
