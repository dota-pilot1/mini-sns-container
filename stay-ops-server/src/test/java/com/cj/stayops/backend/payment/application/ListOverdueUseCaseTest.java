package com.cj.stayops.backend.payment.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.payment.application.dto.OverduePaymentResult;
import com.cj.stayops.backend.payment.application.dto.RegisterPaymentCommand;
import com.cj.stayops.backend.payment.domain.model.PaymentMethod;
import com.cj.stayops.backend.payment.domain.model.PeriodYearMonth;
import com.cj.stayops.backend.room.domain.model.Money;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomNumber;
import com.cj.stayops.backend.room.domain.model.RoomOption;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;
import com.cj.stayops.backend.tenant.domain.model.PhoneNumber;
import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

class ListOverdueUseCaseTest {

	private static final Instant FIXED_NOW = Instant.parse("2026-04-19T10:00:00Z");

	private RegisterManualPaymentUseCaseTest.InMemoryPaymentRepository paymentRepository;
	private RegisterManualPaymentUseCaseTest.InMemoryContractRepository contractRepository;
	private InMemoryTenantRepository tenantRepository;
	private InMemoryRoomRepository roomRepository;
	private Clock clock;
	private ListOverdueUseCase listOverdueUseCase;
	private RegisterManualPaymentUseCase registerUseCase;

	@BeforeEach
	void setUp() {
		paymentRepository = new RegisterManualPaymentUseCaseTest.InMemoryPaymentRepository();
		contractRepository = new RegisterManualPaymentUseCaseTest.InMemoryContractRepository();
		tenantRepository = new InMemoryTenantRepository();
		roomRepository = new InMemoryRoomRepository();
		clock = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
		listOverdueUseCase = new ListOverdueUseCase(
			paymentRepository, contractRepository, tenantRepository, roomRepository, clock
		);
		registerUseCase = new RegisterManualPaymentUseCase(
			paymentRepository, contractRepository, clock
		);
	}

	@Test
	@DisplayName("PAID 가 없는 ACTIVE 계약만 미납으로 반환 — 이름/호수/예상금액/연체일수 채워짐")
	void returns_only_unpaid_active_contracts() {
		Tenant alice = tenantOf("Alice", "01011110000");
		Tenant bob = tenantOf("Bob", "01022220000");
		Room r702 = roomOf("702", 7);
		Room r703 = roomOf("703", 7);

		Contract aliceContract = activeContract(alice, r702, 410_000L);
		Contract bobContract = activeContract(bob, r703, 380_000L);

		registerUseCase.execute(new RegisterPaymentCommand(
			aliceContract.id().asString(), "2026-04",
			410_000L, null, PaymentMethod.BANK_TRANSFER, null
		));

		List<OverduePaymentResult> overdue = listOverdueUseCase.execute(PeriodYearMonth.of("2026-04"));

		assertThat(overdue).hasSize(1);
		OverduePaymentResult only = overdue.get(0);
		assertThat(only.contractId()).isEqualTo(bobContract.id().asString());
		assertThat(only.tenantName()).isEqualTo("Bob");
		assertThat(only.roomNumber()).isEqualTo("703");
		assertThat(only.expectedAmount()).isEqualTo(380_000L);
		assertThat(only.daysOverdue()).isEqualTo(18); // 4/19 - 4/1 = 18일
	}

	@Test
	@DisplayName("REFUNDED 만 있는 계약은 미납으로 잡힌다 (PAID 가 있어야 면제)")
	void refunded_only_is_overdue() {
		Tenant alice = tenantOf("Alice", "01011110000");
		Room r701 = roomOf("701", 7);
		Contract contract = activeContract(alice, r701, 410_000L);

		var paid = registerUseCase.execute(new RegisterPaymentCommand(
			contract.id().asString(), "2026-04",
			410_000L, null, PaymentMethod.CARD, null
		));
		// 환불 시뮬: 직접 도메인 호출 후 저장
		var entity = paymentRepository.findById(
			com.cj.stayops.backend.payment.domain.model.PaymentId.of(paid.id())
		).orElseThrow();
		paymentRepository.save(entity.refund(FIXED_NOW, "test refund"));

		List<OverduePaymentResult> overdue = listOverdueUseCase.execute(PeriodYearMonth.of("2026-04"));

		assertThat(overdue).hasSize(1);
		assertThat(overdue.get(0).contractId()).isEqualTo(contract.id().asString());
	}

	@Test
	@DisplayName("중도 취소로 endDate 가 기준월 전으로 단축된 계약은 후보에서 빠진다")
	void truncated_contract_excluded() {
		Tenant alice = tenantOf("Alice", "01011110000");
		Room r701 = roomOf("701", 7);
		Contract contract = Contract.create(
			ContractId.generate(), alice.id().value(), r701.id().value(),
			LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31),
			410_000L, 3_000_000L, FIXED_NOW
		).truncateEndDate(LocalDate.of(2026, 3, 31), FIXED_NOW);
		contractRepository.save(contract);

		List<OverduePaymentResult> overdue = listOverdueUseCase.execute(PeriodYearMonth.of("2026-04"));
		assertThat(overdue).isEmpty();
	}

	@Test
	@DisplayName("기준월이 계약 기간 밖인 ACTIVE 계약은 후보에서 빠진다")
	void out_of_range_active_contract_excluded() {
		Tenant alice = tenantOf("Alice", "01011110000");
		Room r701 = roomOf("701", 7);
		// 5월에 시작하는 계약
		Contract contract = Contract.create(
			ContractId.generate(), alice.id().value(), r701.id().value(),
			LocalDate.of(2026, 5, 1), LocalDate.of(2027, 4, 30),
			410_000L, 3_000_000L, FIXED_NOW
		);
		contractRepository.save(contract);

		List<OverduePaymentResult> overdue = listOverdueUseCase.execute(PeriodYearMonth.of("2026-04"));
		assertThat(overdue).isEmpty();
	}

	// ---------- helpers ----------

	private Tenant tenantOf(String name, String phone) {
		Tenant t = Tenant.register(
			TenantId.generate(), null, name, PhoneNumber.of(phone), null, FIXED_NOW
		);
		tenantRepository.save(t);
		return t;
	}

	private Room roomOf(String number, int floor) {
		Room r = Room.register(
			RoomId.generate(), RoomNumber.of(number), floor, new BigDecimal("3.5"),
			Money.of(400_000L), Money.of(3_000_000L),
			Set.of(RoomOption.AIRCON), null, FIXED_NOW
		);
		roomRepository.save(r);
		return r;
	}

	private Contract activeContract(Tenant tenant, Room room, long monthlyRent) {
		Contract c = Contract.create(
			ContractId.generate(), tenant.id().value(), room.id().value(),
			LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31),
			monthlyRent, 3_000_000L, FIXED_NOW
		);
		contractRepository.save(c);
		return c;
	}

	// ---------- in-memory fakes ----------

	static final class InMemoryTenantRepository implements TenantRepository {
		private final Map<TenantId, Tenant> byId = new HashMap<>();

		@Override
		public Tenant save(Tenant tenant) {
			byId.put(tenant.id(), tenant);
			return tenant;
		}

		@Override
		public Optional<Tenant> findById(TenantId id) {
			return Optional.ofNullable(byId.get(id));
		}

		@Override
		public List<Tenant> findAll() {
			return List.copyOf(byId.values());
		}

		@Override
		public void deleteById(TenantId id) {
			byId.remove(id);
		}
	}

	static final class InMemoryRoomRepository implements RoomRepository {
		private final Map<RoomId, Room> byId = new HashMap<>();
		private final Set<UUID> deleted = new HashSet<>();

		@Override
		public Room save(Room room) {
			byId.put(room.id(), room);
			return room;
		}

		@Override
		public Optional<Room> findById(RoomId id) {
			return Optional.ofNullable(byId.get(id));
		}

		@Override
		public Optional<Room> findByRoomNumber(RoomNumber roomNumber) {
			return byId.values().stream()
				.filter(r -> r.roomNumber().equals(roomNumber))
				.findFirst();
		}

		@Override
		public boolean existsByRoomNumber(RoomNumber roomNumber) {
			return findByRoomNumber(roomNumber).isPresent();
		}

		@Override
		public List<Room> findAll(Integer floor, RoomStatus status) {
			return byId.values().stream()
				.filter(r -> floor == null || r.floor() == floor)
				.filter(r -> status == null || r.status() == status)
				.filter(r -> !deleted.contains(r.id().value()))
				.toList();
		}
	}
}
