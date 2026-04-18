package com.cj.stayops.backend.tenant.application;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.tenant.application.dto.TenantResult;
import com.cj.stayops.backend.tenant.domain.exception.TenantNotFoundException;
import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

/**
 * 퇴실(soft-deleted) 된 입주자를 다시 거주중으로 복원.
 */
@Service
public class RestoreTenantUseCase {

	private final TenantRepository tenantRepository;
	private final Clock clock;

	public RestoreTenantUseCase(TenantRepository tenantRepository, Clock clock) {
		this.tenantRepository = tenantRepository;
		this.clock = clock;
	}

	@Transactional
	public TenantResult execute(String tenantId) {
		TenantId id = TenantId.of(tenantId);
		Tenant tenant = tenantRepository.findByIdIncludingDeleted(id)
			.orElseThrow(() -> new TenantNotFoundException(tenantId));

		Tenant restored = tenant.restore(Instant.now(clock));
		return TenantResult.from(tenantRepository.save(restored));
	}
}
