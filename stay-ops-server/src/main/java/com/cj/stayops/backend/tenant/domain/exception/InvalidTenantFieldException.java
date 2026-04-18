package com.cj.stayops.backend.tenant.domain.exception;

/**
 * Tenant 필드 값이 도메인 제약을 위반했을 때 발생. → 400 Bad Request.
 */
public class InvalidTenantFieldException extends RuntimeException {

	private final String field;

	public InvalidTenantFieldException(String field, String message) {
		super(message);
		this.field = field;
	}

	public String field() {
		return field;
	}
}
