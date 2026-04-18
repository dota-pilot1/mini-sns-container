package com.cj.stayops.backend.tenant.application;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.tenant.domain.exception.TenantNotFoundException;
import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

@Service
public class DeleteTenantUseCase {

	private final TenantRepository tenantRepository;
	private final Clock clock;

	public DeleteTenantUseCase(TenantRepository tenantRepository, Clock clock) {
		this.tenantRepository = tenantRepository;
		this.clock = clock;
	}

	@Transactional
	public void execute(String tenantId) {
		TenantId id = TenantId.of(tenantId);
		Tenant tenant = tenantRepository.findById(id)
			.orElseThrow(() -> new TenantNotFoundException(tenantId));

		Tenant deleted = tenant.markDeleted(Instant.now(clock));
		tenantRepository.save(deleted);
	}
}
