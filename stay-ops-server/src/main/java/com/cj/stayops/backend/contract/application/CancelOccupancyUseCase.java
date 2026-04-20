package com.cj.stayops.backend.contract.application;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.application.dto.CancelOccupancyCommand;
import com.cj.stayops.backend.contract.application.dto.CancelOccupancyResult;
import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.domain.exception.ContractNotFoundException;
import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.payment.application.RefundPaymentUseCase;
import com.cj.stayops.backend.payment.application.dto.RefundPaymentCommand;
import com.cj.stayops.backend.payment.domain.model.Payment;
import com.cj.stayops.backend.payment.domain.model.PaymentStatus;
import com.cj.stayops.backend.payment.domain.repository.PaymentRepository;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

/**
 * 퇴실 처리 — 계약 취소(cancelledAt 세팅) + 관련 PAID 결제 일괄 환불을 한 트랜잭션으로 처리.
 *
 * <p>흐름:
 * <ol>
 *   <li>cancelledAt = moveOutDate 세팅 (항상)</li>
 *   <li>moveOutDate &lt; endDate 이면 endDate 도 단축 (중도 취소 케이스)</li>
 *   <li>이 계약의 모든 PAID 결제를 REFUNDED 로 전환</li>
 *   <li>일할 계산 / 보증금 환불액은 안내용으로 계산해 결과에 포함</li>
 *   <li>이 방에 다른 유효 계약이 없으면 Room 을 VACANT 로 되돌림</li>
 * </ol>
 *
 * <p>부분 환불 미지원 — 모든 PAID 결제는 전액 환불된다. 결과의 usedAmount / depositRefunded
 * 는 운영 기준 권장 금액 안내용이며 실제 DB 금액 변경과 무관하다.
 *
 * <p>EFFECTIVE 와 OVERDUE 모두 이 하나의 use-case 로 처리한다 — 관리자 액션은 동일하게
 * "퇴실 처리 + 환불" 이며, 차이는 moveOutDate 가 endDate 보다 앞인지 뒤인지뿐이다.
 */
@Service
public class CancelOccupancyUseCase {

	private final ContractRepository contractRepository;
	private final PaymentRepository paymentRepository;
	private final RefundPaymentUseCase refundPaymentUseCase;
	private final RoomRepository roomRepository;
	private final Clock clock;

	public CancelOccupancyUseCase(ContractRepository contractRepository,
								  PaymentRepository paymentRepository,
								  RefundPaymentUseCase refundPaymentUseCase,
								  RoomRepository roomRepository,
								  Clock clock) {
		this.contractRepository = contractRepository;
		this.paymentRepository = paymentRepository;
		this.refundPaymentUseCase = refundPaymentUseCase;
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	@Transactional
	public CancelOccupancyResult execute(CancelOccupancyCommand cmd) {
		ContractId contractId = ContractId.of(cmd.contractId());
		Contract contract = contractRepository.findById(contractId)
			.orElseThrow(() -> new ContractNotFoundException(cmd.contractId()));

		LocalDate today = LocalDate.now(clock);
		LocalDate moveOut = cmd.moveOutDate() == null ? today : cmd.moveOutDate();
		Instant now = Instant.now(clock);

		List<Payment> paid = paymentRepository.findAll(
			contractId.value(), null, null, null, PaymentStatus.PAID
		);

		long totalPaid = paid.stream().mapToLong(Payment::amount).sum();
		long usedAmount = calculateUsedAmount(contract.startDate(), contract.endDate(), moveOut, totalPaid);
		long depositRefunded = cmd.refundDeposit() ? contract.deposit() : 0L;

		// moveOut 이 endDate 보다 앞이면 endDate 단축 (중도 취소). 이미 지난 계약이면 endDate 유지.
		Contract updated = moveOut.isBefore(contract.endDate())
			? contract.truncateEndDate(moveOut, now)
			: contract;
		updated = updated.cancel(moveOut, now);
		ContractResult savedResult = ContractResult.from(contractRepository.save(updated));

		releaseRoomIfNoOtherEffective(contract.roomId(), contract.id(), today, now);

		List<String> refundedIds = new ArrayList<>(paid.size());
		long refundedTotal = 0L;
		for (Payment p : paid) {
			refundPaymentUseCase.execute(new RefundPaymentCommand(p.id().value().toString(), null));
			refundedIds.add(p.id().value().toString());
			refundedTotal += p.amount();
		}

		return new CancelOccupancyResult(savedResult, refundedIds, refundedTotal, usedAmount, depositRefunded);
	}

	private void releaseRoomIfNoOtherEffective(UUID roomId, ContractId cancelledId,
											   LocalDate today, Instant now) {
		boolean hasOtherEffective = contractRepository
			.findEffective(today, null, roomId).stream()
			.anyMatch(c -> !c.id().equals(cancelledId));
		if (hasOtherEffective) {
			return;
		}
		roomRepository.findById(RoomId.of(roomId)).ifPresent(room -> {
			if (room.status() == RoomStatus.OCCUPIED) {
				roomRepository.save(room.changeStatus(RoomStatus.VACANT, now));
			}
		});
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
