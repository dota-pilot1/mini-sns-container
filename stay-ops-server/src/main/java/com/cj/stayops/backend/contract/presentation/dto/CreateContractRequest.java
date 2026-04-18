package com.cj.stayops.backend.contract.presentation.dto;

import java.time.LocalDate;

import com.cj.stayops.backend.contract.application.dto.CreateContractCommand;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record CreateContractRequest(
	@NotBlank String tenantId,
	@NotBlank String roomId,
	@NotNull LocalDate startDate,
	@NotNull LocalDate endDate,
	@PositiveOrZero long monthlyRent,
	@PositiveOrZero long deposit
) {
	public CreateContractCommand toCommand() {
		return new CreateContractCommand(
			tenantId, roomId, startDate, endDate, monthlyRent, deposit
		);
	}
}
