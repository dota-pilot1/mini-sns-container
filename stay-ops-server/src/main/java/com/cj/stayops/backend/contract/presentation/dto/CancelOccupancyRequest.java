package com.cj.stayops.backend.contract.presentation.dto;

import java.time.LocalDate;

import com.cj.stayops.backend.contract.application.dto.CancelOccupancyCommand;

public record CancelOccupancyRequest(
	LocalDate moveOutDate,
	Boolean refundDeposit
) {
	public CancelOccupancyCommand toCommand(String contractId) {
		return new CancelOccupancyCommand(
			contractId,
			moveOutDate,
			refundDeposit != null && refundDeposit
		);
	}
}
