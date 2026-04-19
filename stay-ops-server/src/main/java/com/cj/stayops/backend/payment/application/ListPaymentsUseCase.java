package com.cj.stayops.backend.payment.application;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.payment.application.dto.ListPaymentsQuery;
import com.cj.stayops.backend.payment.application.dto.PaymentResult;
import com.cj.stayops.backend.payment.domain.model.PeriodYearMonth;
import com.cj.stayops.backend.payment.domain.repository.PaymentRepository;

@Service
public class ListPaymentsUseCase {

	private final PaymentRepository paymentRepository;

	public ListPaymentsUseCase(PaymentRepository paymentRepository) {
		this.paymentRepository = paymentRepository;
	}

	@Transactional(readOnly = true)
	public List<PaymentResult> execute(ListPaymentsQuery query) {
		PeriodYearMonth period = query.periodYearMonth() == null
			? null
			: PeriodYearMonth.of(query.periodYearMonth());
		PeriodYearMonth fromPeriod = query.fromPeriod() == null
			? null
			: PeriodYearMonth.of(query.fromPeriod());
		PeriodYearMonth toPeriod = query.toPeriod() == null
			? null
			: PeriodYearMonth.of(query.toPeriod());
		return paymentRepository.findAll(query.contractId(), period, fromPeriod, toPeriod, query.status()).stream()
			.map(PaymentResult::from)
			.toList();
	}
}
