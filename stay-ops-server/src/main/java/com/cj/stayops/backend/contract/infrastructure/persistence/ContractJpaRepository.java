package com.cj.stayops.backend.contract.infrastructure.persistence;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ContractJpaRepository extends JpaRepository<ContractJpaEntity, UUID> {

	@Query("""
		SELECT c FROM ContractJpaEntity c
		WHERE (:tenantId IS NULL OR c.tenantId = :tenantId)
		  AND (:roomId IS NULL OR c.roomId = :roomId)
		  AND (:status IS NULL OR c.status = :status)
		ORDER BY c.createdAt DESC
		""")
	List<ContractJpaEntity> findAllByFilters(
		@Param("tenantId") UUID tenantId,
		@Param("roomId") UUID roomId,
		@Param("status") String status
	);

	@Modifying
	@Transactional
	@Query("DELETE FROM ContractJpaEntity c WHERE c.tenantId = :tenantId")
	int deleteByTenantId(@Param("tenantId") UUID tenantId);
}
