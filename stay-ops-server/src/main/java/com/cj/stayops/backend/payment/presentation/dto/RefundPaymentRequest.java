package com.cj.stayops.backend.payment.presentation.dto;

import com.cj.stayops.backend.payment.application.dto.RefundPaymentCommand;

import jakarta.validation.constraints.Size;

public record RefundPaymentRequest(
	@Size(max = 500) String note
) {
	public RefundPaymentCommand toCommand(String paymentId) {
		return new RefundPaymentCommand(paymentId, note);
	}
}
