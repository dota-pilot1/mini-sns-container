package com.cj.stayops.backend.payment.application.dto;

import java.time.Instant;

import com.cj.stayops.backend.payment.domain.model.Payment;
import com.cj.stayops.backend.payment.domain.model.PaymentMethod;
import com.cj.stayops.backend.payment.domain.model.PaymentStatus;

public record PaymentResult(
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
	public static PaymentResult from(Payment p) {
		return new PaymentResult(
			p.id().asString(),
			p.contractId().toString(),
			p.periodYearMonth().asString(),
			p.amount(),
			p.paidAt(),
			p.method(),
			p.status(),
			p.refundedAt(),
			p.note(),
			p.createdAt()
		);
	}
}
