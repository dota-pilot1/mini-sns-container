package com.cj.stayops.backend.contract.application.dto;

import java.time.LocalDate;

public record CreateContractCommand(
	String tenantId,
	String roomId,
	LocalDate startDate,
	LocalDate endDate,
	long monthlyRent,
	long deposit
) { }
