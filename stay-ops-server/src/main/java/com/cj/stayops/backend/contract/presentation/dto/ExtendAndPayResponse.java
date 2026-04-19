package com.cj.stayops.backend.contract.presentation.dto;

import java.util.List;

import com.cj.stayops.backend.contract.application.dto.ExtendAndPayResult;

public record ExtendAndPayResponse(
	ContractResponse contract,
	List<String> paymentIds,
	long totalAmount
) {
	public static ExtendAndPayResponse from(ExtendAndPayResult result) {
		return new ExtendAndPayResponse(
			ContractResponse.from(result.contract()),
			result.paymentIds(),
			result.totalAmount()
		);
	}
}
