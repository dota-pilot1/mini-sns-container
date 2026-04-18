package com.cj.stayops.backend.tenant.presentation.dto;

import java.time.LocalDate;

import com.cj.stayops.backend.tenant.application.dto.CreateTenantCommand;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTenantRequest(
	@NotBlank @Size(max = 50) String name,
	@NotBlank String phoneNumber,
	String roomId,
	LocalDate moveInDate,
	@Size(max = 500) String memo
) {
	public CreateTenantCommand toCommand() {
		return new CreateTenantCommand(name, phoneNumber, roomId, moveInDate, memo);
	}
}
