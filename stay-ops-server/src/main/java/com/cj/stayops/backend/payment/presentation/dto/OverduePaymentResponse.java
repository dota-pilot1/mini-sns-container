package com.cj.stayops.backend.payment.presentation.dto;

import com.cj.stayops.backend.payment.application.dto.OverduePaymentResult;

public record OverduePaymentResponse(
	String contractId,
	String tenantId,
	String tenantName,
	String roomId,
	String roomNumber,
	long expectedAmount,
	long daysOverdue
) {
	public static OverduePaymentResponse from(OverduePaymentResult r) {
		return new OverduePaymentResponse(
			r.contractId(), r.tenantId(), r.tenantName(),
			r.roomId(), r.roomNumber(),
			r.expectedAmount(), r.daysOverdue()
		);
	}
}
