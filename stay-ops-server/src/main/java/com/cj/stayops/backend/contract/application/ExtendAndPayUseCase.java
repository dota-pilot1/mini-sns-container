package com.cj.stayops.backend.contract.application;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.application.dto.ExtendAndPayCommand;
import com.cj.stayops.backend.contract.application.dto.ExtendAndPayResult;
import com.cj.stayops.backend.contract.domain.exception.ContractNotFoundException;
import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.payment.domain.exception.DuplicatePaidPaymentException;
import com.cj.stayops.backend.payment.domain.model.Payment;
import com.cj.stayops.backend.payment.domain.model.PaymentId;
import com.cj.stayops.backend.payment.domain.model.PaymentMethod;
import com.cj.stayops.backend.payment.domain.model.PeriodYearMonth;
import com.cj.stayops.backend.payment.domain.repository.PaymentRepository;

/**
 * 재계약(연장) + 결제 등록 — 기존 계약의 endDate 를 수정하지 않고 새 Contract 를 체인에 건다.
 * <p>
 * 흐름:
 * <ol>
 *   <li>기존 계약(ACTIVE) 로드</li>
 *   <li>새 Contract 생성: startDate = 기존.endDate + 1, endDate = start + N개월 - 1,
 *       monthlyRent = amountPerMonth ?? 기존.monthlyRent, deposit 는 기존 값 승계,
 *       previousContractId = 기존.id</li>
 *   <li>새 Contract 에 N 개월 Payment(PAID) 생성</li>
 * </ol>
 * 기존 계약은 그대로 ACTIVE 로 남아 자기 endDate 까지 유효. 시간이 지나면 새 계약으로 자연스럽게 교대.
 */
@Service
public class ExtendAndPayUseCase {

	private final ContractRepository contractRepository;
	private final PaymentRepository paymentRepository;
	private final Clock clock;

	public ExtendAndPayUseCase(ContractRepository contractRepository,
							   PaymentRepository paymentRepository,
							   Clock clock) {
		this.contractRepository = contractRepository;
		this.paymentRepository = paymentRepository;
		this.clock = clock;
	}

	@Transactional
	public ExtendAndPayResult execute(ExtendAndPayCommand cmd) {
		ContractId previousId = ContractId.of(cmd.contractId());
		Contract previous = contractRepository.findById(previousId)
			.orElseThrow(() -> new ContractNotFoundException(cmd.contractId()));

		Instant now = Instant.now(clock);

		LocalDate newStart = previous.endDate().plusDays(1);
		LocalDate newEnd = newStart.plusMonths(cmd.months()).minusDays(1);
		long amountPerMonth = cmd.amountPerMonth() != null
			? cmd.amountPerMonth()
			: previous.monthlyRent();

		ContractId renewalId = ContractId.generate();
		Contract renewed = Contract.create(
			renewalId,
			previous.tenantId(),
			previous.roomId(),
			newStart,
			newEnd,
			amountPerMonth,
			previous.deposit(),
			previousId,
			now
		);
		contractRepository.save(renewed);

		YearMonth firstPeriodYm = YearMonth.from(newStart);
		List<PeriodYearMonth> periods = new ArrayList<>(cmd.months());
		for (int i = 0; i < cmd.months(); i++) {
			PeriodYearMonth p = PeriodYearMonth.of(firstPeriodYm.plusMonths(i));
			if (paymentRepository.existsPaid(renewalId.value(), p)) {
				throw new DuplicatePaidPaymentException(renewalId.value().toString(), p.asString());
			}
			periods.add(p);
		}

		PaymentMethod method = cmd.method() == null ? PaymentMethod.CASH : cmd.method();

		List<String> paymentIds = new ArrayList<>(cmd.months());
		long total = 0L;
		for (PeriodYearMonth p : periods) {
			Payment payment = Payment.register(
				PaymentId.generate(),
				renewalId.value(),
				p,
				amountPerMonth,
				now,
				method,
				cmd.note(),
				now
			);
			paymentRepository.save(payment);
			paymentIds.add(payment.id().value().toString());
			total += amountPerMonth;
		}

		return new ExtendAndPayResult(ContractResult.from(renewed), paymentIds, total);
	}
}
