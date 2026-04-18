package com.cj.stayops.backend.tenant.presentation.dto;

import java.time.Instant;

import com.cj.stayops.backend.tenant.application.dto.TenantResult;

public record TenantResponse(
	String tenantId,
	String userId,
	String name,
	String phoneNumber,
	String memo,
	Instant createdAt,
	Instant updatedAt
) {
	public static TenantResponse from(TenantResult r) {
		return new TenantResponse(
			r.tenantId(), r.userId(), r.name(), r.phoneNumber(), r.memo(),
			r.createdAt(), r.updatedAt()
		);
	}
}
