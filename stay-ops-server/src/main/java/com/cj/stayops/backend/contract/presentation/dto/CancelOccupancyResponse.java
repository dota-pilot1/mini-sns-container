package com.cj.stayops.backend.contract.presentation.dto;

import java.util.List;

import com.cj.stayops.backend.contract.application.dto.CancelOccupancyResult;

public record CancelOccupancyResponse(
	ContractResponse contract,
	List<String> refundedPaymentIds,
	long refundedTotal,
	long usedAmount,
	long depositRefunded
) {
	public static CancelOccupancyResponse from(CancelOccupancyResult result) {
		return new CancelOccupancyResponse(
			ContractResponse.from(result.contract()),
			result.refundedPaymentIds(),
			result.refundedTotal(),
			result.usedAmount(),
			result.depositRefunded()
		);
	}
}
