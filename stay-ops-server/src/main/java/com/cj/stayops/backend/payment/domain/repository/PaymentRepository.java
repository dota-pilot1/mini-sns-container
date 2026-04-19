package com.cj.stayops.backend.payment.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.cj.stayops.backend.payment.domain.model.Payment;
import com.cj.stayops.backend.payment.domain.model.PaymentId;
import com.cj.stayops.backend.payment.domain.model.PaymentStatus;
import com.cj.stayops.backend.payment.domain.model.PeriodYearMonth;

public interface PaymentRepository {

	Payment save(Payment payment);

	Optional<Payment> findById(PaymentId id);

	/**
	 * 필터 조회 — 모두 nullable. paidAt 내림차순.
	 * period 가 주어지면 정확한 월 매칭, fromPeriod/toPeriod 가 주어지면 범위 매칭.
	 */
	List<Payment> findAll(UUID contractId, PeriodYearMonth period,
						  PeriodYearMonth fromPeriod, PeriodYearMonth toPeriod,
						  PaymentStatus status);

	/**
	 * 한 계약의 한 달에 PAID 레코드가 이미 존재하는지.
	 * (REFUNDED 는 중복 허용이라 카운트에서 제외)
	 */
	boolean existsPaid(UUID contractId, PeriodYearMonth period);

	/**
	 * 주어진 contractId 집합 중 해당 월에 PAID 레코드가 존재하는 것들.
	 * 미납자 리스트 계산 시 N+1 쿼리를 피하기 위함.
	 */
	List<UUID> findContractIdsWithPaidIn(List<UUID> contractIds, PeriodYearMonth period);

	void deleteById(PaymentId id);

	/** 계약 hard-delete 시 cascade. */
	void deleteByContractId(UUID contractId);
}
