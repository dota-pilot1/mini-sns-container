package com.cj.stayops.backend.payment.domain.model;

/**
 * 결제 상태.
 * <ul>
 *   <li>PAID — 정상 입금 완료</li>
 *   <li>REFUNDED — 환불 처리됨 (원본 보존, soft delete)</li>
 * </ul>
 */
public enum PaymentStatus {
	PAID,
	REFUNDED
}
