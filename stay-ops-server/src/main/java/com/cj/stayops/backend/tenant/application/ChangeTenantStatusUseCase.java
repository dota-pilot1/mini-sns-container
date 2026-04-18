package com.cj.stayops.backend.tenant.application;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.tenant.application.dto.ChangeTenantStatusCommand;
import com.cj.stayops.backend.tenant.application.dto.TenantResult;
import com.cj.stayops.backend.tenant.domain.exception.TenantNotFoundException;
import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

/**
 * 입주자 상태 전이. 칸반 드래그앤드롭(예: "예약 → 거주중 → 퇴실")이 이 유스케이스를 호출한다.
 * <p>
 * 교과서 DDD 원칙상 레코드를 다른 테이블로 옮기는 대신 같은 레코드의 {@code status} 컬럼만 변경한다 → 이력 보존.
 */
@Service
public class ChangeTenantStatusUseCase {

	private final TenantRepository tenantRepository;
	private final Clock clock;

	public ChangeTenantStatusUseCase(TenantRepository tenantRepository, Clock clock) {
		this.tenantRepository = tenantRepository;
		this.clock = clock;
	}

	@Transactional
	public TenantResult execute(ChangeTenantStatusCommand command) {
		TenantId id = TenantId.of(command.tenantId());
		Tenant tenant = tenantRepository.findById(id)
			.orElseThrow(() -> new TenantNotFoundException(command.tenantId()));

		Tenant updated = tenant.changeStatus(command.newStatus(), Instant.now(clock));
		Tenant saved = tenantRepository.save(updated);
		return TenantResult.from(saved);
	}
}
