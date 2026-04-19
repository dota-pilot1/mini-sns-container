package com.cj.stayops.backend.payment.application.dto;

public record OverduePaymentResult(
	String contractId,
	String tenantId,
	String tenantName,
	String roomId,
	String roomNumber,
	long expectedAmount,
	long daysOverdue
) { }
