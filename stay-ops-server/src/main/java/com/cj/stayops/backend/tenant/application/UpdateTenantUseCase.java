package com.cj.stayops.backend.tenant.application;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.tenant.application.dto.TenantResult;
import com.cj.stayops.backend.tenant.application.dto.UpdateTenantCommand;
import com.cj.stayops.backend.tenant.domain.exception.TenantNotFoundException;
import com.cj.stayops.backend.tenant.domain.model.PhoneNumber;
import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

@Service
public class UpdateTenantUseCase {

	private final TenantRepository tenantRepository;
	private final Clock clock;

	public UpdateTenantUseCase(TenantRepository tenantRepository, Clock clock) {
		this.tenantRepository = tenantRepository;
		this.clock = clock;
	}

	@Transactional
	public TenantResult execute(UpdateTenantCommand command) {
		TenantId id = TenantId.of(command.tenantId());
		Tenant tenant = tenantRepository.findById(id)
			.orElseThrow(() -> new TenantNotFoundException(command.tenantId()));

		PhoneNumber newPhone = command.phoneNumber() == null ? null : PhoneNumber.of(command.phoneNumber());
		UUID newRoomId = command.roomId() == null ? null : UUID.fromString(command.roomId());

		Tenant updated = tenant.update(
			command.name(),
			newPhone,
			newRoomId,
			command.clearRoom(),
			command.moveInDate(),
			command.moveOutDate(),
			command.memo(),
			Instant.now(clock)
		);

		Tenant saved = tenantRepository.save(updated);
		return TenantResult.from(saved);
	}
}
