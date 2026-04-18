package com.cj.stayops.backend.tenant.application;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.tenant.application.dto.CreateTenantCommand;
import com.cj.stayops.backend.tenant.application.dto.TenantResult;
import com.cj.stayops.backend.tenant.domain.model.PhoneNumber;
import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

@Service
public class CreateTenantUseCase {

	private final TenantRepository tenantRepository;
	private final Clock clock;

	public CreateTenantUseCase(TenantRepository tenantRepository, Clock clock) {
		this.tenantRepository = tenantRepository;
		this.clock = clock;
	}

	@Transactional
	public TenantResult execute(CreateTenantCommand command) {
		PhoneNumber phone = PhoneNumber.of(command.phoneNumber());
		UUID userId = command.userId() == null ? null : UUID.fromString(command.userId());
		Instant now = Instant.now(clock);

		Tenant tenant = Tenant.register(
			TenantId.generate(),
			userId,
			command.name(),
			phone,
			command.memo(),
			now
		);

		Tenant saved = tenantRepository.save(tenant);
		return TenantResult.from(saved);
	}
}
