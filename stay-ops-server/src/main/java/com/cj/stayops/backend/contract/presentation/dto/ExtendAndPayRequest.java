package com.cj.stayops.backend.contract.presentation.dto;

import com.cj.stayops.backend.contract.application.dto.ExtendAndPayCommand;
import com.cj.stayops.backend.payment.domain.model.PaymentMethod;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;

public record ExtendAndPayRequest(
	@Min(1) @Max(60) int months,
	@PositiveOrZero Long amountPerMonth,
	PaymentMethod method,
	String note
) {
	public ExtendAndPayCommand toCommand(String contractId) {
		return new ExtendAndPayCommand(contractId, months, amountPerMonth, method, note);
	}
}
