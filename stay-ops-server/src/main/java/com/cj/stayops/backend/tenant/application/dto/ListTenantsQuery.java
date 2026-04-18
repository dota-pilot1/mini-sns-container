package com.cj.stayops.backend.tenant.application.dto;

import java.util.UUID;

import com.cj.stayops.backend.tenant.domain.model.TenantStatus;

/**
 * 입주자 목록 조회 쿼리.
 * <p>
 * deletedOnly=true 이면 퇴실(soft-deleted) 레코드만 반환한다.
 */
public record ListTenantsQuery(TenantStatus status, UUID roomId, boolean deletedOnly) {
	public ListTenantsQuery(TenantStatus status, UUID roomId) {
		this(status, roomId, false);
	}
}
