package com.cj.stayops.backend.payment.presentation.dto;

import java.time.Instant;

import com.cj.stayops.backend.payment.application.dto.RegisterPaymentCommand;
import com.cj.stayops.backend.payment.domain.model.PaymentMethod;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record RegisterPaymentRequest(
	@NotBlank String contractId,
	@NotBlank String periodYearMonth,
	@PositiveOrZero long amount,
	Instant paidAt,
	@NotNull PaymentMethod method,
	@Size(max = 500) String note
) {
	public RegisterPaymentCommand toCommand() {
		return new RegisterPaymentCommand(
			contractId, periodYearMonth, amount, paidAt, method, note
		);
	}
}
