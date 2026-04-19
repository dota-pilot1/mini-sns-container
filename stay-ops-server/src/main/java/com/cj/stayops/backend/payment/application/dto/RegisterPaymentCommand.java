package com.cj.stayops.backend.payment.application.dto;

import java.time.Instant;

import com.cj.stayops.backend.payment.domain.model.PaymentMethod;

public record RegisterPaymentCommand(
	String contractId,
	String periodYearMonth,
	long amount,
	Instant paidAt,
	PaymentMethod method,
	String note
) { }
