package com.cj.stayops.backend.tenant.presentation.dto;

import com.cj.stayops.backend.tenant.application.dto.ChangeTenantStatusCommand;
import com.cj.stayops.backend.tenant.domain.model.TenantStatus;

import jakarta.validation.constraints.NotNull;

public record ChangeTenantStatusRequest(@NotNull TenantStatus status) {
	public ChangeTenantStatusCommand toCommand(String tenantId) {
		return new ChangeTenantStatusCommand(tenantId, status);
	}
}
