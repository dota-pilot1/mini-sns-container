package com.cj.stayops.backend.tenant.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.model.TenantStatus;

/**
 * Tenant Aggregate Repository (도메인 계약).
 * <p>
 * 구현체는 Infrastructure Layer(JPA)에 위치한다.
 */
public interface TenantRepository {

	Tenant save(Tenant tenant);

	/** 삭제되지 않은 입주자 조회. */
	Optional<Tenant> findById(TenantId id);

	/** 삭제 여부 무관하게 조회 (복원/완전삭제용). */
	Optional<Tenant> findByIdIncludingDeleted(TenantId id);

	/**
	 * 삭제되지 않은 입주자 목록을 createdAt 내림차순으로 반환. 필터는 모두 nullable.
	 */
	List<Tenant> findAll(TenantStatus status, UUID roomId);

	/** 삭제(deleted_at != null)된 입주자 목록을 deletedAt 내림차순으로 반환. */
	List<Tenant> findAllDeleted();

	/** DB 에서 물리적으로 제거 (hard delete). */
	void hardDelete(TenantId id);
}
