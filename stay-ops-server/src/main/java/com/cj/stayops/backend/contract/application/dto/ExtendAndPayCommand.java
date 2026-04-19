package com.cj.stayops.backend.contract.application.dto;

import com.cj.stayops.backend.payment.domain.model.PaymentMethod;

public record ExtendAndPayCommand(
	String contractId,
	int months,
	Long amountPerMonth,
	PaymentMethod method,
	String note
) { }
