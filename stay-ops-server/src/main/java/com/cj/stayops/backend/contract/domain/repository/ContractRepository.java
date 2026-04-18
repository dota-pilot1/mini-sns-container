package com.cj.stayops.backend.contract.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.model.ContractStatus;

public interface ContractRepository {

	Contract save(Contract contract);

	Optional<Contract> findById(ContractId id);

	/**
	 * 필터 조건 조회 — 모두 nullable. createdAt 내림차순.
	 */
	List<Contract> findAll(UUID tenantId, UUID roomId, ContractStatus status);

	/** 주어진 tenant 의 모든 계약을 DB 에서 제거 (tenant hard-delete 시 cascade). */
	void deleteByTenantId(UUID tenantId);

	void deleteById(ContractId id);
}
