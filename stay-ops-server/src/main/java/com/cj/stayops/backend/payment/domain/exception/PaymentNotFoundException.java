package com.cj.stayops.backend.payment.domain.exception;

public class PaymentNotFoundException extends RuntimeException {

	public PaymentNotFoundException(String paymentId) {
		super("Payment not found: " + paymentId);
	}
}
