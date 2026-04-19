package com.cj.stayops.backend.contract.application.dto;

import java.util.List;

public record ExtendAndPayResult(
	ContractResult contract,
	List<String> paymentIds,
	long totalAmount
) { }
