package com.cj.stayops.backend.tenant.domain.exception;

/**
 * 존재하지 않는 Tenant 를 조회/변경/삭제하려 할 때 발생. → 404 Not Found.
 */
public class TenantNotFoundException extends RuntimeException {

	public TenantNotFoundException(String tenantId) {
		super("Tenant not found: " + tenantId);
	}
}
