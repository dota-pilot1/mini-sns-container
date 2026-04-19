package com.cj.stayops.backend.payment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.cj.stayops.backend.contract.domain.exception.ContractNotFoundException;
import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.model.ContractStatus;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.payment.application.dto.PaymentResult;
import com.cj.stayops.backend.payment.application.dto.RegisterPaymentCommand;
import com.cj.stayops.backend.payment.domain.exception.DuplicatePaidPaymentException;
import com.cj.stayops.backend.payment.domain.exception.InvalidPaymentFieldException;
import com.cj.stayops.backend.payment.domain.model.Payment;
import com.cj.stayops.backend.payment.domain.model.PaymentId;
import com.cj.stayops.backend.payment.domain.model.PaymentMethod;
import com.cj.stayops.backend.payment.domain.model.PaymentStatus;
import com.cj.stayops.backend.payment.domain.model.PeriodYearMonth;
import com.cj.stayops.backend.payment.domain.repository.PaymentRepository;

class RegisterManualPaymentUseCaseTest {

	private static final Instant FIXED_NOW = Instant.parse("2026-04-19T10:00:00Z");

	private InMemoryPaymentRepository paymentRepository;
	private InMemoryContractRepository contractRepository;
	private Clock clock;
	private RegisterManualPaymentUseCase useCase;

	private Contract activeContract;

	@BeforeEach
	void setUp() {
		paymentRepository = new InMemoryPaymentRepository();
		contractRepository = new InMemoryContractRepository();
		clock = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
		useCase = new RegisterManualPaymentUseCase(paymentRepository, contractRepository, clock);

		activeContract = Contract.create(
			ContractId.generate(),
			UUID.randomUUID(),
			UUID.randomUUID(),
			LocalDate.of(2026, 3, 1),
			LocalDate.of(2027, 2, 28),
			450_000L,
			3_000_000L,
			FIXED_NOW
		);
		contractRepository.save(activeContract);
	}

	@Test
	@DisplayName("정상 등록 → PAID 레코드 생성, paidAt 누락 시 now")
	void register_success() {
		PaymentResult result = useCase.execute(new RegisterPaymentCommand(
			activeContract.id().asString(),
			"2026-04",
			450_000L,
			null,
			PaymentMethod.BANK_TRANSFER,
			"4월 입금"
		));

		assertThat(result.status()).isEqualTo(PaymentStatus.PAID);
		assertThat(result.amount()).isEqualTo(450_000L);
		assertThat(result.periodYearMonth()).isEqualTo("2026-04");
		assertThat(result.paidAt()).isEqualTo(FIXED_NOW);
		assertThat(result.refundedAt()).isNull();
		assertThat(result.method()).isEqualTo(PaymentMethod.BANK_TRANSFER);
		assertThat(result.note()).isEqualTo("4월 입금");
		assertThat(paymentRepository.byId).hasSize(1);
	}

	@Test
	@DisplayName("paidAt 명시 시 그대로 저장")
	void register_uses_explicit_paid_at() {
		Instant paidAt = Instant.parse("2026-04-15T01:23:45Z");
		PaymentResult result = useCase.execute(new RegisterPaymentCommand(
			activeContract.id().asString(),
			"2026-04",
			450_000L,
			paidAt,
			PaymentMethod.CASH,
			null
		));

		assertThat(result.paidAt()).isEqualTo(paidAt);
		assertThat(result.note()).isNull();
	}

	@Test
	@DisplayName("존재하지 않는 계약 → ContractNotFoundException")
	void unknown_contract_throws() {
		String unknown = UUID.randomUUID().toString();
		assertThatThrownBy(() -> useCase.execute(new RegisterPaymentCommand(
			unknown, "2026-04", 1_000L, null, PaymentMethod.CARD, null
		))).isInstanceOf(ContractNotFoundException.class);
	}

	@Test
	@DisplayName("기준월이 계약 기간 밖 → InvalidPaymentFieldException")
	void period_outside_contract_throws() {
		assertThatThrownBy(() -> useCase.execute(new RegisterPaymentCommand(
			activeContract.id().asString(),
			"2027-03",
			450_000L, null, PaymentMethod.CARD, null
		))).isInstanceOf(InvalidPaymentFieldException.class)
			.hasMessageContaining("계약 기간");
	}

	@Test
	@DisplayName("형식이 잘못된 periodYearMonth → InvalidPaymentFieldException")
	void invalid_period_format_throws() {
		assertThatThrownBy(() -> useCase.execute(new RegisterPaymentCommand(
			activeContract.id().asString(),
			"2026/04",
			1_000L, null, PaymentMethod.CARD, null
		))).isInstanceOf(InvalidPaymentFieldException.class);
	}

	@Test
	@DisplayName("같은 (계약, 월)에 PAID 중복 → DuplicatePaidPaymentException")
	void duplicate_paid_throws() {
		useCase.execute(new RegisterPaymentCommand(
			activeContract.id().asString(),
			"2026-04",
			450_000L, null, PaymentMethod.CARD, null
		));

		assertThatThrownBy(() -> useCase.execute(new RegisterPaymentCommand(
			activeContract.id().asString(),
			"2026-04",
			500_000L, null, PaymentMethod.CARD, null
		))).isInstanceOf(DuplicatePaidPaymentException.class);
	}

	// ---------- In-memory fakes ----------

	static final class InMemoryPaymentRepository implements PaymentRepository {
		final Map<PaymentId, Payment> byId = new HashMap<>();

		@Override
		public Payment save(Payment payment) {
			byId.put(payment.id(), payment);
			return payment;
		}

		@Override
		public Optional<Payment> findById(PaymentId id) {
			return Optional.ofNullable(byId.get(id));
		}

		@Override
		public List<Payment> findAll(UUID contractId, PeriodYearMonth period,
									 PeriodYearMonth fromPeriod, PeriodYearMonth toPeriod,
									 PaymentStatus status) {
			return byId.values().stream()
				.filter(p -> contractId == null || p.contractId().equals(contractId))
				.filter(p -> period == null || p.periodYearMonth().equals(period))
				.filter(p -> fromPeriod == null || p.periodYearMonth().asString().compareTo(fromPeriod.asString()) >= 0)
				.filter(p -> toPeriod == null || p.periodYearMonth().asString().compareTo(toPeriod.asString()) <= 0)
				.filter(p -> status == null || p.status() == status)
				.sorted((a, b) -> b.paidAt().compareTo(a.paidAt()))
				.toList();
		}

		@Override
		public boolean existsPaid(UUID contractId, PeriodYearMonth period) {
			return byId.values().stream()
				.anyMatch(p -> p.contractId().equals(contractId)
					&& p.periodYearMonth().equals(period)
					&& p.status() == PaymentStatus.PAID);
		}

		@Override
		public List<UUID> findContractIdsWithPaidIn(List<UUID> contractIds, PeriodYearMonth period) {
			return contractIds.stream()
				.filter(cid -> existsPaid(cid, period))
				.distinct()
				.toList();
		}

		@Override
		public void deleteById(PaymentId id) {
			byId.remove(id);
		}

		@Override
		public void deleteByContractId(UUID contractId) {
			byId.entrySet().removeIf(e -> e.getValue().contractId().equals(contractId));
		}
	}

	static final class InMemoryContractRepository implements ContractRepository {
		final Map<ContractId, Contract> byId = new HashMap<>();

		@Override
		public Contract save(Contract contract) {
			byId.put(contract.id(), contract);
			return contract;
		}

		@Override
		public Optional<Contract> findById(ContractId id) {
			return Optional.ofNullable(byId.get(id));
		}

		@Override
		public List<Contract> findAll(UUID tenantId, UUID roomId, ContractStatus status) {
			return byId.values().stream()
				.filter(c -> tenantId == null || c.tenantId().equals(tenantId))
				.filter(c -> roomId == null || c.roomId().equals(roomId))
				.filter(c -> status == null || c.status() == status)
				.toList();
		}

		@Override
		public void deleteByTenantId(UUID tenantId) {
			byId.entrySet().removeIf(e -> e.getValue().tenantId().equals(tenantId));
		}
	}
}
