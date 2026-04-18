package com.cj.stayops.backend.tenant.presentation.dto;

import com.cj.stayops.backend.tenant.application.dto.CreateTenantCommand;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTenantRequest(
	String userId,              // 선택적 — 기존 User 기반 입주 시
	@NotBlank @Size(max = 50) String name,
	@NotBlank String phoneNumber,
	@Size(max = 500) String memo
) {
	public CreateTenantCommand toCommand() {
		return new CreateTenantCommand(userId, name, phoneNumber, memo);
	}
}
