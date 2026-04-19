package com.cj.stayops.backend.contract.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ContractJpaRepository extends JpaRepository<ContractJpaEntity, UUID> {

	/** 소프트 삭제되지 않은 계약만 — 일반 조회용. */
	@Query("""
		SELECT c FROM ContractJpaEntity c
		WHERE c.deletedAt IS NULL
		  AND (:tenantId IS NULL OR c.tenantId = :tenantId)
		  AND (:roomId IS NULL OR c.roomId = :roomId)
		  AND (:status IS NULL OR c.status = :status)
		ORDER BY c.createdAt DESC
		""")
	List<ContractJpaEntity> findAllByFilters(
		@Param("tenantId") UUID tenantId,
		@Param("roomId") UUID roomId,
		@Param("status") String status
	);

	/** 소프트 삭제 포함 단건 조회 — 리포지토리 내부용 (save 전 존재 확인 등). */
	@Query("SELECT c FROM ContractJpaEntity c WHERE c.id = :id AND c.deletedAt IS NULL")
	Optional<ContractJpaEntity> findByIdActive(@Param("id") UUID id);

	@Modifying
	@Transactional
	@Query("DELETE FROM ContractJpaEntity c WHERE c.tenantId = :tenantId")
	int deleteByTenantId(@Param("tenantId") UUID tenantId);
}
