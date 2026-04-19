package com.cj.stayops.backend.contract.application;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.application.dto.CancelOccupancyCommand;
import com.cj.stayops.backend.contract.application.dto.CancelOccupancyResult;
import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.application.dto.TerminateContractCommand;
import com.cj.stayops.backend.contract.domain.exception.ContractNotFoundException;
import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.payment.application.RefundPaymentUseCase;
import com.cj.stayops.backend.payment.application.dto.RefundPaymentCommand;
import com.cj.stayops.backend.payment.domain.model.Payment;
import com.cj.stayops.backend.payment.domain.model.PaymentStatus;
import com.cj.stayops.backend.payment.domain.repository.PaymentRepository;

/**
 * 퇴실 취소 — 계약 종료 + 관련 결제 일괄 환불을 한 트랜잭션으로 처리.
 *
 * <p>흐름:
 * <ol>
 *   <li>계약을 TERMINATED 로 변경 (퇴실일 = endDate)</li>
 *   <li>이 계약의 모든 PAID 결제를 REFUNDED 로 전환</li>
 *   <li>일할 계산 / 보증금 환불액은 안내용으로 계산해 결과에 포함</li>
 * </ol>
 *
 * <p>부분 환불 미지원 — 모든 PAID 결제는 전액 환불된다. 결과의 usedAmount / depositRefunded
 * 는 운영 기준 권장 금액 안내용이며 실제 DB 금액 변경과 무관하다.
 */
@Service
public class CancelOccupancyUseCase {

	private final ContractRepository contractRepository;
	private final PaymentRepository paymentRepository;
	private final TerminateContractUseCase terminateContractUseCase;
	private final RefundPaymentUseCase refundPaymentUseCase;
	private final Clock clock;

	public CancelOccupancyUseCase(ContractRepository contractRepository,
								  PaymentRepository paymentRepository,
								  TerminateContractUseCase terminateContractUseCase,
								  RefundPaymentUseCase refundPaymentUseCase,
								  Clock clock) {
		this.contractRepository = contractRepository;
		this.paymentRepository = paymentRepository;
		this.terminateContractUseCase = terminateContractUseCase;
		this.refundPaymentUseCase = refundPaymentUseCase;
		this.clock = clock;
	}

	@Transactional
	public CancelOccupancyResult execute(CancelOccupancyCommand cmd) {
		ContractId contractId = ContractId.of(cmd.contractId());
		Contract contract = contractRepository.findById(contractId)
			.orElseThrow(() -> new ContractNotFoundException(cmd.contractId()));

		LocalDate moveOut = cmd.moveOutDate() == null ? LocalDate.now(clock) : cmd.moveOutDate();

		List<Payment> paid = paymentRepository.findAll(
			contractId.value(), null, null, null, PaymentStatus.PAID
		);

		long totalPaid = paid.stream().mapToLong(Payment::amount).sum();
		long usedAmount = calculateUsedAmount(contract.startDate(), contract.endDate(), moveOut, totalPaid);
		long depositRefunded = cmd.refundDeposit() ? contract.deposit() : 0L;

		ContractResult terminated = terminateContractUseCase.execute(
			new TerminateContractCommand(cmd.contractId(), moveOut)
		);

		List<String> refundedIds = new ArrayList<>(paid.size());
		long refundedTotal = 0L;
		for (Payment p : paid) {
			refundPaymentUseCase.execute(new RefundPaymentCommand(p.id().value().toString(), null));
			refundedIds.add(p.id().value().toString());
			refundedTotal += p.amount();
		}

		return new CancelOccupancyResult(terminated, refundedIds, refundedTotal, usedAmount, depositRefunded);
	}

	private static long calculateUsedAmount(LocalDate start, LocalDate end, LocalDate moveOut, long totalPaid) {
		long totalDays = ChronoUnit.DAYS.between(start, end);
		if (totalDays <= 0 || totalPaid <= 0) {
			return 0L;
		}
		long usedDaysRaw = ChronoUnit.DAYS.between(start, moveOut);
		long usedDays = Math.max(0L, Math.min(totalDays, usedDaysRaw));
		return Math.round((double) totalPaid * usedDays / totalDays);
	}
}
