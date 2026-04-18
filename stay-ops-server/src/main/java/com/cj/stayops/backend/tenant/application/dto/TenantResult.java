package com.cj.stayops.backend.tenant.application.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantStatus;

public record TenantResult(
	String tenantId,
	String name,
	String phoneNumber,       // 표시용 (01X-XXXX-XXXX)
	String roomId,            // nullable
	TenantStatus status,
	LocalDate moveInDate,     // nullable
	LocalDate moveOutDate,    // nullable
	String memo,              // nullable
	Instant createdAt,
	Instant updatedAt
) {
	public static TenantResult from(Tenant t) {
		return new TenantResult(
			t.id().asString(),
			t.name(),
			t.phoneNumber().formatted(),
			t.roomId() == null ? null : t.roomId().toString(),
			t.status(),
			t.moveInDate(),
			t.moveOutDate(),
			t.memo(),
			t.createdAt(),
			t.updatedAt()
		);
	}
}
