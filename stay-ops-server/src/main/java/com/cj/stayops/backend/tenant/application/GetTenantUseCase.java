package com.cj.stayops.backend.tenant.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.tenant.application.dto.TenantResult;
import com.cj.stayops.backend.tenant.domain.exception.TenantNotFoundException;
import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

@Service
public class GetTenantUseCase {

	private final TenantRepository tenantRepository;

	public GetTenantUseCase(TenantRepository tenantRepository) {
		this.tenantRepository = tenantRepository;
	}

	@Transactional(readOnly = true)
	public TenantResult execute(String tenantId) {
		Tenant tenant = tenantRepository.findById(TenantId.of(tenantId))
			.orElseThrow(() -> new TenantNotFoundException(tenantId));
		return TenantResult.from(tenant);
	}
}
