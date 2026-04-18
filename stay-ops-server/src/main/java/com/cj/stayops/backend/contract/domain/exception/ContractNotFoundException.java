package com.cj.stayops.backend.contract.domain.exception;

public class ContractNotFoundException extends RuntimeException {

	public ContractNotFoundException(String contractId) {
		super("Contract not found: " + contractId);
	}
}
