package com.cj.stayops.backend.tenant.infrastructure.persistence;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TenantJpaRepository extends JpaRepository<TenantJpaEntity, UUID> {

	@Query("""
		SELECT t FROM TenantJpaEntity t
		ORDER BY t.createdAt DESC
		""")
	List<TenantJpaEntity> findAllOrdered();
}
