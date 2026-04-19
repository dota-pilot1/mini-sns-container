package com.cj.stayops.backend.payment.application.dto;

import java.util.UUID;

import com.cj.stayops.backend.payment.domain.model.PaymentStatus;

public record ListPaymentsQuery(
	UUID contractId,
	String periodYearMonth,
	String fromPeriod,
	String toPeriod,
	PaymentStatus status
) { }
