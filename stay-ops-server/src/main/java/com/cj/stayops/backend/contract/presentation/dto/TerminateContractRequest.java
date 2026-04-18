package com.cj.stayops.backend.contract.presentation.dto;

import java.time.LocalDate;

import com.cj.stayops.backend.contract.application.dto.TerminateContractCommand;

public record TerminateContractRequest(LocalDate terminationDate) {
	public TerminateContractCommand toCommand(String contractId) {
		return new TerminateContractCommand(contractId, terminationDate);
	}
}
