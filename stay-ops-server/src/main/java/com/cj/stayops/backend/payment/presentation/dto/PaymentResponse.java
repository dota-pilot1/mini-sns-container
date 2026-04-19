package com.cj.stayops.backend.payment.presentation.dto;

import java.time.Instant;

import com.cj.stayops.backend.payment.application.dto.PaymentResult;
import com.cj.stayops.backend.payment.domain.model.PaymentMethod;
import com.cj.stayops.backend.payment.domain.model.PaymentStatus;

public record PaymentResponse(
	String id,
	String contractId,
	String periodYearMonth,
	long amount,
	Instant paidAt,
	PaymentMethod method,
	PaymentStatus status,
	Instant refundedAt,
	String note,
	Instant createdAt
) {
	public static PaymentResponse from(PaymentResult r) {
		return new PaymentResponse(
			r.id(), r.contractId(), r.periodYearMonth(), r.amount(),
			r.paidAt(), r.method(), r.status(), r.refundedAt(),
			r.note(), r.createdAt()
		);
	}
}
