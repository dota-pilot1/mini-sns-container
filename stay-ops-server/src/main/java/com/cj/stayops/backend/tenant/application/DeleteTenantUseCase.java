package com.cj.stayops.backend.tenant.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.tenant.domain.exception.TenantNotFoundException;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

/**
 * 입주자를 완전 삭제한다. 관련된 모든 Contract 도 함께 제거 (cascade).
 */
@Service
public class DeleteTenantUseCase {

	private final TenantRepository tenantRepository;
	private final ContractRepository contractRepository;

	public DeleteTenantUseCase(TenantRepository tenantRepository,
							   ContractRepository contractRepository) {
		this.tenantRepository = tenantRepository;
		this.contractRepository = contractRepository;
	}

	@Transactional
	public void execute(String tenantId) {
		TenantId id = TenantId.of(tenantId);
		tenantRepository.findById(id)
			.orElseThrow(() -> new TenantNotFoundException(tenantId));

		contractRepository.deleteByTenantId(id.value());
		tenantRepository.deleteById(id);
	}
}
