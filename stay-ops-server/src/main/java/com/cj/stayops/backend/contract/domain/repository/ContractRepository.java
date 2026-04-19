package com.cj.stayops.backend.contract.domain.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;

public interface ContractRepository {

	Contract save(Contract contract);

	Optional<Contract> findById(ContractId id);

	/**
	 * 필터 조건 조회 — 소프트 삭제 제외. createdAt 내림차순.
	 */
	List<Contract> findAll(UUID tenantId, UUID roomId);

	/**
	 * 주어진 날짜에 유효한(startDate ≤ asOf ≤ endDate) 계약 — 소프트 삭제 제외.
	 */
	List<Contract> findEffective(LocalDate asOf, UUID tenantId, UUID roomId);

	/** 주어진 tenant 의 모든 계약을 DB 에서 제거 (tenant hard-delete 시 cascade). */
	void deleteByTenantId(UUID tenantId);
}
