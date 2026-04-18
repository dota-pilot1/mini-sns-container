package com.cj.stayops.backend.contract.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.domain.exception.ContractNotFoundException;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;

@Service
public class GetContractUseCase {

	private final ContractRepository contractRepository;

	public GetContractUseCase(ContractRepository contractRepository) {
		this.contractRepository = contractRepository;
	}

	@Transactional(readOnly = true)
	public ContractResult execute(String contractId) {
		return contractRepository.findById(ContractId.of(contractId))
			.map(ContractResult::from)
			.orElseThrow(() -> new ContractNotFoundException(contractId));
	}
}
