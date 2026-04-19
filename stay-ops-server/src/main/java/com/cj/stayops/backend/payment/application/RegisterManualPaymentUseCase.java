package com.cj.stayops.backend.payment.application;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.domain.exception.ContractNotFoundException;
import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.payment.application.dto.PaymentResult;
import com.cj.stayops.backend.payment.application.dto.RegisterPaymentCommand;
import com.cj.stayops.backend.payment.domain.exception.DuplicatePaidPaymentException;
import com.cj.stayops.backend.payment.domain.exception.InvalidPaymentFieldException;
import com.cj.stayops.backend.payment.domain.model.Payment;
import com.cj.stayops.backend.payment.domain.model.PaymentId;
import com.cj.stayops.backend.payment.domain.model.PeriodYearMonth;
import com.cj.stayops.backend.payment.domain.repository.PaymentRepository;

/**
 * 관리자가 수동으로 입금을 확인하고 PAID 레코드를 생성한다.
 * <p>
 * 검증:
 * <ul>
 *   <li>contract 가 존재해야 함</li>
 *   <li>periodYearMonth 가 contract 의 startDate~endDate 안에 포함되어야 함</li>
 *   <li>같은 (contract, period) 조합에 PAID 가 이미 있으면 거부</li>
 * </ul>
 */
@Service
public class RegisterManualPaymentUseCase {

	private final PaymentRepository paymentRepository;
	private final ContractRepository contractRepository;
	private final Clock clock;

	public RegisterManualPaymentUseCase(PaymentRepository paymentRepository,
										ContractRepository contractRepository,
										Clock clock) {
		this.paymentRepository = paymentRepository;
		this.contractRepository = contractRepository;
		this.clock = clock;
	}

	@Transactional
	public PaymentResult execute(RegisterPaymentCommand cmd) {
		ContractId contractId = ContractId.of(cmd.contractId());
		Contract contract = contractRepository.findById(contractId)
			.orElseThrow(() -> new ContractNotFoundException(cmd.contractId()));

		PeriodYearMonth period = PeriodYearMonth.of(cmd.periodYearMonth());
		if (!period.isWithin(contract.startDate(), contract.endDate())) {
			throw new InvalidPaymentFieldException("periodYearMonth",
				"기준월(" + period.asString() + ")이 계약 기간(" +
					contract.startDate() + " ~ " + contract.endDate() + ") 밖입니다.");
		}

		UUID contractUuid = contractId.value();
		if (paymentRepository.existsPaid(contractUuid, period)) {
			throw new DuplicatePaidPaymentException(cmd.contractId(), period.asString());
		}

		Instant now = Instant.now(clock);
		Instant paidAt = cmd.paidAt() == null ? now : cmd.paidAt();
		Payment payment = Payment.register(
			PaymentId.generate(),
			contractUuid,
			period,
			cmd.amount(),
			paidAt,
			cmd.method(),
			cmd.note(),
			now
		);
		return PaymentResult.from(paymentRepository.save(payment));
	}
}
