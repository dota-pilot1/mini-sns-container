package com.cj.stayops.backend.payment.infrastructure.persistence;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface PaymentJpaRepository extends JpaRepository<PaymentJpaEntity, UUID> {

	@Query("""
		SELECT p FROM PaymentJpaEntity p
		WHERE (:contractId IS NULL OR p.contractId = :contractId)
		  AND (:period IS NULL OR p.periodYearMonth = :period)
		  AND (:status IS NULL OR p.status = :status)
		ORDER BY p.paidAt DESC
		""")
	List<PaymentJpaEntity> findAllByFilters(
		@Param("contractId") UUID contractId,
		@Param("period") String period,
		@Param("status") String status
	);

	@Query("""
		SELECT COUNT(p) > 0 FROM PaymentJpaEntity p
		WHERE p.contractId = :contractId
		  AND p.periodYearMonth = :period
		  AND p.status = 'PAID'
		""")
	boolean existsPaid(@Param("contractId") UUID contractId,
					   @Param("period") String period);

	@Query("""
		SELECT DISTINCT p.contractId FROM PaymentJpaEntity p
		WHERE p.contractId IN :contractIds
		  AND p.periodYearMonth = :period
		  AND p.status = 'PAID'
		""")
	List<UUID> findContractIdsWithPaidIn(
		@Param("contractIds") List<UUID> contractIds,
		@Param("period") String period
	);

	@Modifying
	@Transactional
	@Query("DELETE FROM PaymentJpaEntity p WHERE p.contractId = :contractId")
	int deleteByContractId(@Param("contractId") UUID contractId);
}
