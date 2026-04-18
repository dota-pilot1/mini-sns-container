package com.cj.stayops.backend.tenant.application;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.tenant.application.dto.TenantResult;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

@Service
public class ListTenantsUseCase {

	private final TenantRepository tenantRepository;

	public ListTenantsUseCase(TenantRepository tenantRepository) {
		this.tenantRepository = tenantRepository;
	}

	@Transactional(readOnly = true)
	public List<TenantResult> execute() {
		return tenantRepository.findAll().stream().map(TenantResult::from).toList();
	}
}
