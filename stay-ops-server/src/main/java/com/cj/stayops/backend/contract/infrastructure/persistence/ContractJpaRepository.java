package com.cj.stayops.backend.contract.infrastructure.persistence;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ContractJpaRepository extends JpaRepository<ContractJpaEntity, UUID> {

	/** 소프트 삭제되지 않은 계약 전체 — 일반 조회용. */
	@Query("""
		SELECT c FROM ContractJpaEntity c
		WHERE c.deletedAt IS NULL
		  AND (:tenantId IS NULL OR c.tenantId = :tenantId)
		  AND (:roomId IS NULL OR c.roomId = :roomId)
		ORDER BY c.createdAt DESC
		""")
	List<ContractJpaEntity> findAllByFilters(
		@Param("tenantId") UUID tenantId,
		@Param("roomId") UUID roomId
	);

	/** 주어진 날짜에 유효한(startDate ≤ date ≤ endDate) 소프트 삭제되지 않은 계약. */
	@Query("""
		SELECT c FROM ContractJpaEntity c
		WHERE c.deletedAt IS NULL
		  AND c.startDate <= :asOf
		  AND c.endDate >= :asOf
		  AND (:tenantId IS NULL OR c.tenantId = :tenantId)
		  AND (:roomId IS NULL OR c.roomId = :roomId)
		ORDER BY c.createdAt DESC
		""")
	List<ContractJpaEntity> findEffective(
		@Param("asOf") LocalDate asOf,
		@Param("tenantId") UUID tenantId,
		@Param("roomId") UUID roomId
	);

	/** 소프트 삭제 제외 단건 조회. */
	@Query("SELECT c FROM ContractJpaEntity c WHERE c.id = :id AND c.deletedAt IS NULL")
	Optional<ContractJpaEntity> findByIdActive(@Param("id") UUID id);

	@Modifying
	@Transactional
	@Query("DELETE FROM ContractJpaEntity c WHERE c.tenantId = :tenantId")
	int deleteByTenantId(@Param("tenantId") UUID tenantId);
}
