package com.cj.stayops.backend.tenant.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.tenant.domain.exception.TenantNotFoundException;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

/**
 * 입주자를 DB 에서 물리적으로 완전 제거 (복구 불가).
 * 일반적으로 퇴실(soft delete) 컬럼에서만 호출된다.
 */
@Service
public class HardDeleteTenantUseCase {

	private final TenantRepository tenantRepository;

	public HardDeleteTenantUseCase(TenantRepository tenantRepository) {
		this.tenantRepository = tenantRepository;
	}

	@Transactional
	public void execute(String tenantId) {
		TenantId id = TenantId.of(tenantId);
		tenantRepository.findByIdIncludingDeleted(id)
			.orElseThrow(() -> new TenantNotFoundException(tenantId));
		tenantRepository.hardDelete(id);
	}
}
