package com.cj.stayops.backend.contract.application.dto;

import java.util.List;

/**
 * "퇴실 취소" 집계 결과.
 *
 * <p>현재 결제 도메인이 부분 환불을 지원하지 않아, refundedTotal 은 환불된 PAID 결제들의
 * 실제 금액 합계이다. usedAmount / depositRefunded 는 운영 기준 안내용 값.
 */
public record CancelOccupancyResult(
	ContractResult contract,
	List<String> refundedPaymentIds,
	long refundedTotal,
	long usedAmount,
	long depositRefunded
) { }
