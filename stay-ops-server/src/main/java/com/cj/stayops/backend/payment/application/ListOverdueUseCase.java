package com.cj.stayops.backend.payment.application;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractStatus;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.payment.application.dto.OverduePaymentResult;
import com.cj.stayops.backend.payment.domain.model.PeriodYearMonth;
import com.cj.stayops.backend.payment.domain.repository.PaymentRepository;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;
import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

/**
 * 기준월 기준 미납자 리스트 조회.
 * <p>
 * 후보군 = 기준월에 효력이 있는 ACTIVE 계약. 그 중 PAID 결제 레코드가 없는 계약을 반환.
 * <p>
 * 주의: contract status 만으로 거른다 — TERMINATED/EXPIRED 는 제외. ACTIVE 라도 endDate 가
 * 기준월 이전이거나 startDate 가 기준월 이후이면 효력 밖이므로 제외.
 */
@Service
public class ListOverdueUseCase {

	private final PaymentRepository paymentRepository;
	private final ContractRepository contractRepository;
	private final TenantRepository tenantRepository;
	private final RoomRepository roomRepository;
	private final Clock clock;

	public ListOverdueUseCase(PaymentRepository paymentRepository,
							  ContractRepository contractRepository,
							  TenantRepository tenantRepository,
							  RoomRepository roomRepository,
							  Clock clock) {
		this.paymentRepository = paymentRepository;
		this.contractRepository = contractRepository;
		this.tenantRepository = tenantRepository;
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public List<OverduePaymentResult> execute(PeriodYearMonth period) {
		List<Contract> activeContracts = contractRepository
			.findAll(null, null, ContractStatus.ACTIVE).stream()
			.filter(c -> period.isWithin(c.startDate(), c.endDate()))
			.toList();
		if (activeContracts.isEmpty()) {
			return List.of();
		}

		List<UUID> contractIds = activeContracts.stream()
			.map(c -> c.id().value())
			.toList();
		Set<UUID> paidContractIds = new HashSet<>(
			paymentRepository.findContractIdsWithPaidIn(contractIds, period)
		);

		LocalDate today = LocalDate.now(clock);
		LocalDate periodFirstDay = period.firstDay();

		return activeContracts.stream()
			.filter(c -> !paidContractIds.contains(c.id().value()))
			.map(c -> toOverdueResult(c, today, periodFirstDay))
			.toList();
	}

	private OverduePaymentResult toOverdueResult(Contract c, LocalDate today, LocalDate periodFirstDay) {
		String tenantName = tenantRepository.findById(TenantId.of(c.tenantId()))
			.map(Tenant::name)
			.orElse("(알 수 없음)");
		String roomNumber = roomRepository.findById(RoomId.of(c.roomId()))
			.map(Room::roomNumber)
			.map(rn -> rn.value())
			.orElse("(알 수 없음)");

		long daysOverdue = today.isBefore(periodFirstDay)
			? 0
			: ChronoUnit.DAYS.between(periodFirstDay, today);

		return new OverduePaymentResult(
			c.id().asString(),
			c.tenantId().toString(),
			tenantName,
			c.roomId().toString(),
			roomNumber,
			c.monthlyRent(),
			daysOverdue
		);
	}
}
