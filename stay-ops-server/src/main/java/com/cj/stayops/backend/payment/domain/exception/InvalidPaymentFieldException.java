package com.cj.stayops.backend.payment.domain.exception;

public class InvalidPaymentFieldException extends RuntimeException {

	private final String field;

	public InvalidPaymentFieldException(String field, String message) {
		super(message);
		this.field = field;
	}

	public String field() {
		return field;
	}
}
