package com.cj.stayops.backend.tenant.infrastructure.seed;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.cj.stayops.backend.contract.application.CreateContractUseCase;
import com.cj.stayops.backend.contract.application.TerminateContractUseCase;
import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.application.dto.CreateContractCommand;
import com.cj.stayops.backend.contract.application.dto.TerminateContractCommand;
import com.cj.stayops.backend.room.infrastructure.persistence.RoomJpaEntity;
import com.cj.stayops.backend.room.infrastructure.persistence.RoomJpaRepository;
import com.cj.stayops.backend.tenant.application.CreateTenantUseCase;
import com.cj.stayops.backend.tenant.application.dto.CreateTenantCommand;
import com.cj.stayops.backend.tenant.application.dto.TenantResult;
import com.cj.stayops.backend.tenant.infrastructure.persistence.TenantJpaRepository;

/**
 * 개발용 입주자/계약 시더.
 * <p>
 * 방 상태에 맞춰 Tenant + Contract 를 쌍으로 생성한다.
 * <ul>
 *   <li>OCCUPIED 방 → Tenant + ACTIVE Contract (오늘 시작, 1개월 계약)</li>
 *   <li>RESERVED 방 → Tenant + ACTIVE Contract (미래 시작)</li>
 *   <li>VACANT 방 최대 2개 → Tenant + TERMINATED Contract (과거 거주 이력 데모)</li>
 * </ul>
 */
@Component
@ConditionalOnProperty(prefix = "stay-ops.dev", name = "seed-tenants", havingValue = "true")
public class TenantDevSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(TenantDevSeeder.class);

	private final TenantJpaRepository tenantJpaRepository;
	private final RoomJpaRepository roomJpaRepository;
	private final CreateTenantUseCase createTenantUseCase;
	private final CreateContractUseCase createContractUseCase;
	private final TerminateContractUseCase terminateContractUseCase;

	public TenantDevSeeder(TenantJpaRepository tenantJpaRepository,
						   RoomJpaRepository roomJpaRepository,
						   CreateTenantUseCase createTenantUseCase,
						   CreateContractUseCase createContractUseCase,
						   TerminateContractUseCase terminateContractUseCase) {
		this.tenantJpaRepository = tenantJpaRepository;
		this.roomJpaRepository = roomJpaRepository;
		this.createTenantUseCase = createTenantUseCase;
		this.createContractUseCase = createContractUseCase;
		this.terminateContractUseCase = terminateContractUseCase;
	}

	private static final String[] NAMES = {
		"김민수", "이지현", "박서준", "최유나", "정도윤",
		"강하은", "조예린", "윤서우", "장하린", "임시우",
		"한지안", "서지호", "오하늘", "백세아", "노지훈",
		"홍예준", "전채원", "남도윤", "권나윤", "배시온",
		"문서율", "황이준", "안채아", "류해인", "고재이"
	};

	private static final String PHONE_PREFIX = "010-2345-";

	@Override
	public void run(org.springframework.boot.ApplicationArguments args) {
		long existing = tenantJpaRepository.count();
		if (existing > 0) {
			log.info("[TenantDevSeeder] 기존 입주자 {}명 존재 → 시드 스킵", existing);
			return;
		}

		List<RoomJpaEntity> rooms = roomJpaRepository.findAll();
		if (rooms.isEmpty()) {
			log.info("[TenantDevSeeder] 방이 없어 시드 스킵");
			return;
		}

		List<RoomJpaEntity> occupiedRooms = rooms.stream()
			.filter(r -> "OCCUPIED".equals(r.getStatus()) && r.getDeletedAt() == null)
			.sorted((a, b) -> a.getRoomNumber().compareTo(b.getRoomNumber()))
			.toList();
		List<RoomJpaEntity> reservedRooms = rooms.stream()
			.filter(r -> "RESERVED".equals(r.getStatus()) && r.getDeletedAt() == null)
			.sorted((a, b) -> a.getRoomNumber().compareTo(b.getRoomNumber()))
			.toList();
		List<RoomJpaEntity> vacantRooms = rooms.stream()
			.filter(r -> "VACANT".equals(r.getStatus()) && r.getDeletedAt() == null)
			.sorted((a, b) -> a.getRoomNumber().compareTo(b.getRoomNumber()))
			.toList();

		LocalDate today = LocalDate.now();
		int nameIdx = 0;

		log.info("[TenantDevSeeder] 시드 시작 — OCCUPIED {}, RESERVED {}, VACANT {}",
			occupiedRooms.size(), reservedRooms.size(), vacantRooms.size());

		for (int i = 0; i < occupiedRooms.size(); i++) {
			RoomJpaEntity room = occupiedRooms.get(i);
			TenantResult tenant = createTenant(nameIdx++);
			LocalDate start = today.minusDays(30L + i * 7L);
			createContractUseCase.execute(new CreateContractCommand(
				tenant.tenantId(),
				room.getId().toString(),
				start,
				start.plusMonths(1),
				room.getMonthlyRent(),
				room.getDeposit()
			));
		}

		for (int i = 0; i < reservedRooms.size(); i++) {
			RoomJpaEntity room = reservedRooms.get(i);
			TenantResult tenant = createTenant(nameIdx++);
			LocalDate start = today.plusDays(7L + i * 3L);
			createContractUseCase.execute(new CreateContractCommand(
				tenant.tenantId(),
				room.getId().toString(),
				start,
				start.plusMonths(1),
				room.getMonthlyRent(),
				room.getDeposit()
			));
		}

		int historicalCount = Math.min(2, vacantRooms.size());
		for (int i = 0; i < historicalCount; i++) {
			RoomJpaEntity room = vacantRooms.get(i);
			TenantResult tenant = createTenant(nameIdx++);
			LocalDate start = today.minusMonths(6).minusDays(i * 14L);
			ContractResult contract = createContractUseCase.execute(new CreateContractCommand(
				tenant.tenantId(),
				room.getId().toString(),
				start,
				start.plusMonths(1),
				room.getMonthlyRent(),
				room.getDeposit()
			));
			terminateContractUseCase.execute(new TerminateContractCommand(
				contract.contractId(), start.plusMonths(1)
			));
		}

		log.info("[TenantDevSeeder] 시드 완료 — 거주중 {}, 예정 {}, 퇴실이력 {}",
			occupiedRooms.size(), reservedRooms.size(), historicalCount);
	}

	private TenantResult createTenant(int idx) {
		String name = NAMES[idx % NAMES.length];
		String phone = PHONE_PREFIX + String.format("%04d", 1000 + (idx + 1) * 37 % 9000);
		return createTenantUseCase.execute(new CreateTenantCommand(null, name, phone, null));
	}
}
