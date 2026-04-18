package com.cj.stayops.backend.tenant.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA Repository (기술 세부사항).
 */
public interface TenantJpaRepository extends JpaRepository<TenantJpaEntity, UUID> {

	Optional<TenantJpaEntity> findByIdAndDeletedAtIsNull(UUID id);

	/**
	 * 필터 조회 (삭제되지 않은 입주자만). 각 파라미터가 null 이면 해당 조건은 무시.
	 * 정렬: createdAt 내림차순.
	 */
	@Query("""
		SELECT t FROM TenantJpaEntity t
		WHERE t.deletedAt IS NULL
		  AND (:status IS NULL OR t.status = :status)
		  AND (:roomId IS NULL OR t.roomId = :roomId)
		ORDER BY t.createdAt DESC
		""")
	List<TenantJpaEntity> findAllByFilters(
		@Param("status") String status,
		@Param("roomId") UUID roomId
	);

	/**
	 * 퇴실(삭제된) 입주자만 조회. deletedAt 내림차순 (최근 퇴실 먼저).
	 */
	@Query("""
		SELECT t FROM TenantJpaEntity t
		WHERE t.deletedAt IS NOT NULL
		ORDER BY t.deletedAt DESC
		""")
	List<TenantJpaEntity> findAllDeleted();
}
