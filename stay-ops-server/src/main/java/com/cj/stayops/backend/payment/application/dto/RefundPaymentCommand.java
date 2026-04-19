package com.cj.stayops.backend.payment.application.dto;

public record RefundPaymentCommand(
	String paymentId,
	String note
) { }
