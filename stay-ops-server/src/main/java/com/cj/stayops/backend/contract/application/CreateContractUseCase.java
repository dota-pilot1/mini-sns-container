package com.cj.stayops.backend.contract.application;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.application.dto.CreateContractCommand;
import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.tenant.domain.exception.TenantNotFoundException;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

@Service
public class CreateContractUseCase {

	private final ContractRepository contractRepository;
	private final TenantRepository tenantRepository;
	private final Clock clock;

	public CreateContractUseCase(ContractRepository contractRepository,
								 TenantRepository tenantRepository,
								 Clock clock) {
		this.contractRepository = contractRepository;
		this.tenantRepository = tenantRepository;
		this.clock = clock;
	}

	@Transactional
	public ContractResult execute(CreateContractCommand cmd) {
		TenantId tenantId = TenantId.of(cmd.tenantId());
		tenantRepository.findById(tenantId)
			.orElseThrow(() -> new TenantNotFoundException(cmd.tenantId()));

		Contract contract = Contract.create(
			ContractId.generate(),
			tenantId.value(),
			UUID.fromString(cmd.roomId()),
			cmd.startDate(),
			cmd.endDate(),
			cmd.monthlyRent(),
			cmd.deposit(),
			Instant.now(clock)
		);
		return ContractResult.from(contractRepository.save(contract));
	}
}
