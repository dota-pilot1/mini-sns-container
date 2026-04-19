package com.cj.stayops.backend.payment.domain.exception;

/**
 * (contractId, periodYearMonth, status=PAID) 유니크 위반.
 * 한 계약의 한 달에는 PAID 레코드가 하나만 존재할 수 있다.
 */
public class DuplicatePaidPaymentException extends RuntimeException {

	public DuplicatePaidPaymentException(String contractId, String periodYearMonth) {
		super("이미 해당 월에 입금 처리된 내역이 있습니다. contractId="
			+ contractId + ", period=" + periodYearMonth);
	}
}
