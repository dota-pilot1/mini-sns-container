package com.cj.stayops.backend.contract.application;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.application.dto.ListContractsQuery;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;

@Service
public class ListContractsUseCase {

	private final ContractRepository contractRepository;

	public ListContractsUseCase(ContractRepository contractRepository) {
		this.contractRepository = contractRepository;
	}

	@Transactional(readOnly = true)
	public List<ContractResult> execute(ListContractsQuery q) {
		var contracts = q.effectiveOn() != null
			? contractRepository.findEffective(q.effectiveOn(), q.tenantId(), q.roomId())
			: contractRepository.findAll(q.tenantId(), q.roomId());
		return contracts.stream()
			.map(ContractResult::from)
			.toList();
	}
}
