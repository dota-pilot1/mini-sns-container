package com.cj.stayops.backend.payment.domain.model;

/**
 * 결제 수단.
 * <ul>
 *   <li>CARD — 신용카드</li>
 *   <li>CASH — 현금</li>
 *   <li>BANK_TRANSFER — 인터넷뱅킹 / 계좌이체</li>
 * </ul>
 */
public enum PaymentMethod {
	CARD,
	CASH,
	BANK_TRANSFER
}
