package com.cj.stayops.backend.contract.presentation.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.cj.stayops.backend.contract.application.dto.ContractResult;

public record ContractResponse(
	String contractId,
	String tenantId,
	String roomId,
	LocalDate startDate,
	LocalDate endDate,
	long monthlyRent,
	long deposit,
	String previousContractId,
	LocalDate cancelledAt,
	Instant createdAt,
	Instant updatedAt
) {
	public static ContractResponse from(ContractResult r) {
		return new ContractResponse(
			r.contractId(), r.tenantId(), r.roomId(),
			r.startDate(), r.endDate(),
			r.monthlyRent(), r.deposit(),
			r.previousContractId(),
			r.cancelledAt(),
			r.createdAt(), r.updatedAt()
		);
	}
}
