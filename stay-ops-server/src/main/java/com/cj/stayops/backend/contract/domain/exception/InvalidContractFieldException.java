package com.cj.stayops.backend.contract.domain.exception;

public class InvalidContractFieldException extends RuntimeException {

	private final String field;

	public InvalidContractFieldException(String field, String message) {
		super(message);
		this.field = field;
	}

	public String field() {
		return field;
	}
}
