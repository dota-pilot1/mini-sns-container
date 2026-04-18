package com.cj.stayops.backend.tenant.application.dto;

import java.time.Instant;

import com.cj.stayops.backend.tenant.domain.model.Tenant;

public record TenantResult(
	String tenantId,
	String userId,     // nullable
	String name,
	String phoneNumber,
	String memo,
	Instant createdAt,
	Instant updatedAt
) {
	public static TenantResult from(Tenant t) {
		return new TenantResult(
			t.id().asString(),
			t.userId() == null ? null : t.userId().toString(),
			t.name(),
			t.phoneNumber().formatted(),
			t.memo(),
			t.createdAt(),
			t.updatedAt()
		);
	}
}
