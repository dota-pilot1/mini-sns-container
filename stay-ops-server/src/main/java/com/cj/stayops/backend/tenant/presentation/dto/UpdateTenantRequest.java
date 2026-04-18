package com.cj.stayops.backend.tenant.presentation.dto;

import com.cj.stayops.backend.tenant.application.dto.UpdateTenantCommand;

import jakarta.validation.constraints.Size;

public record UpdateTenantRequest(
	@Size(max = 50) String name,
	String phoneNumber,
	@Size(max = 500) String memo
) {
	public UpdateTenantCommand toCommand(String tenantId) {
		return new UpdateTenantCommand(tenantId, name, phoneNumber, memo);
	}
}
