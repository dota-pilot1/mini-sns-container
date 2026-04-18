package com.cj.stayops.backend.contract.application.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractStatus;

public record ContractResult(
	String contractId,
	String tenantId,
	String roomId,
	LocalDate startDate,
	LocalDate endDate,
	long monthlyRent,
	long deposit,
	ContractStatus status,
	Instant createdAt,
	Instant updatedAt
) {
	public static ContractResult from(Contract c) {
		return new ContractResult(
			c.id().asString(),
			c.tenantId().toString(),
			c.roomId().toString(),
			c.startDate(),
			c.endDate(),
			c.monthlyRent(),
			c.deposit(),
			c.status(),
			c.createdAt(),
			c.updatedAt()
		);
	}
}
