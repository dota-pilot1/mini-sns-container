package com.cj.stayops.backend.contract.application.dto;

import java.time.LocalDate;

public record CancelOccupancyCommand(
	String contractId,
	LocalDate moveOutDate,
	boolean refundDeposit
) { }
