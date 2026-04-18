package com.cj.stayops.backend.contract.application;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.application.dto.TerminateContractCommand;
import com.cj.stayops.backend.contract.domain.exception.ContractNotFoundException;
import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;

/**
 * 계약 중도 종료 (퇴실 처리).
 */
@Service
public class TerminateContractUseCase {

	private final ContractRepository contractRepository;
	private final Clock clock;

	public TerminateContractUseCase(ContractRepository contractRepository, Clock clock) {
		this.contractRepository = contractRepository;
		this.clock = clock;
	}

	@Transactional
	public ContractResult execute(TerminateContractCommand cmd) {
		Contract contract = contractRepository.findById(ContractId.of(cmd.contractId()))
			.orElseThrow(() -> new ContractNotFoundException(cmd.contractId()));

		LocalDate termination = cmd.terminationDate() == null
			? LocalDate.now(clock)
			: cmd.terminationDate();

		Contract terminated = contract.terminate(termination, Instant.now(clock));
		return ContractResult.from(contractRepository.save(terminated));
	}
}
