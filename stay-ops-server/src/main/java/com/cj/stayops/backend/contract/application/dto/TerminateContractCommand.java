package com.cj.stayops.backend.contract.application.dto;

import java.time.LocalDate;

public record TerminateContractCommand(
	String contractId,
	LocalDate terminationDate
) { }
