package com.cj.stayops.backend.tenant.infrastructure.seed;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.cj.stayops.backend.room.infrastructure.persistence.RoomJpaEntity;
import com.cj.stayops.backend.room.infrastructure.persistence.RoomJpaRepository;
import com.cj.stayops.backend.tenant.application.ChangeTenantStatusUseCase;
import com.cj.stayops.backend.tenant.application.CreateTenantUseCase;
import com.cj.stayops.backend.tenant.application.dto.ChangeTenantStatusCommand;
import com.cj.stayops.backend.tenant.application.dto.CreateTenantCommand;
import com.cj.stayops.backend.tenant.application.dto.TenantResult;
import com.cj.stayops.backend.tenant.domain.model.TenantStatus;
import com.cj.stayops.backend.tenant.infrastructure.persistence.TenantJpaRepository;

/**
 * 개발 환경용 입주자 시드 데이터 러너.
 * <p>
 * {@code stay-ops.dev.seed-tenants=true} 이고 DB 에 입주자가 0명일 때만 방 상태에 맞춰 더미 데이터를 삽입한다.
 * <p>
 * <b>정합성 규칙:</b> 방의 실제 상태와 입주자 상태를 맞춘다.
 * <ul>
 *   <li>OCCUPIED 방 → ACTIVE 입주자 1명 (모든 입실 방에 거주자 매핑)</li>
 *   <li>RESERVED 방 → RESERVED 입주자 1명 (예약 방에 입주 대기자 매핑)</li>
 *   <li>VACANT 방 2곳 → MOVED_OUT 입주자 (과거 거주자 이력 데모용)</li>
 * </ul>
 * <p>
 * CreateTenantUseCase 를 거치므로 도메인 검증(이름/전화/메모/날짜) 이 그대로 실행된다.
 */
@Component
@ConditionalOnProperty(prefix = "stay-ops.dev", name = "seed-tenants", havingValue = "true")
public class TenantDevSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(TenantDevSeeder.class);

	private final TenantJpaRepository tenantJpaRepository;
	private final RoomJpaRepository roomJpaRepository;
	private final CreateTenantUseCase createTenantUseCase;
	private final ChangeTenantStatusUseCase changeTenantStatusUseCase;

	public TenantDevSeeder(TenantJpaRepository tenantJpaRepository,
						   RoomJpaRepository roomJpaRepository,
						   CreateTenantUseCase createTenantUseCase,
						   ChangeTenantStatusUseCase changeTenantStatusUseCase) {
		this.tenantJpaRepository = tenantJpaRepository;
		this.roomJpaRepository = roomJpaRepository;
		this.createTenantUseCase = createTenantUseCase;
		this.changeTenantStatusUseCase = changeTenantStatusUseCase;
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
			log.info("[TenantDevSeeder] 방이 없어 입주자 시드 스킵");
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

		log.info("[TenantDevSeeder] 시드 시작 — OCCUPIED {}, RESERVED {}, VACANT {} 방 발견",
			occupiedRooms.size(), reservedRooms.size(), vacantRooms.size());

		// OCCUPIED 방 전원에 ACTIVE 입주자 매핑
		for (int i = 0; i < occupiedRooms.size(); i++) {
			RoomJpaEntity room = occupiedRooms.get(i);
			String name = NAMES[nameIdx++ % NAMES.length];
			String phone = PHONE_PREFIX + String.format("%04d", 1000 + nameIdx * 37 % 9000);
			LocalDate moveIn = today.minusDays(30L + i * 7L);

			TenantResult created = createTenantUseCase.execute(new CreateTenantCommand(
				name, phone, room.getId().toString(), moveIn, null
			));
			changeTenantStatusUseCase.execute(new ChangeTenantStatusCommand(
				created.tenantId(), TenantStatus.ACTIVE
			));
		}

		// RESERVED 방 전원에 RESERVED 입주자 매핑
		for (int i = 0; i < reservedRooms.size(); i++) {
			RoomJpaEntity room = reservedRooms.get(i);
			String name = NAMES[nameIdx++ % NAMES.length];
			String phone = PHONE_PREFIX + String.format("%04d", 1000 + nameIdx * 37 % 9000);
			LocalDate moveIn = today.plusDays(7L + i * 3L); // 곧 입실 예정

			createTenantUseCase.execute(new CreateTenantCommand(
				name, phone, room.getId().toString(), moveIn, null
			));
			// 상태는 기본 RESERVED 로 시작하므로 별도 전이 불필요
		}

		// 과거 이력 데모: VACANT 방 중 앞 2개에 MOVED_OUT 이력 생성 (퇴실 후 방은 공실)
		int historicalCount = Math.min(2, vacantRooms.size());
		for (int i = 0; i < historicalCount; i++) {
			RoomJpaEntity room = vacantRooms.get(i);
			String name = NAMES[nameIdx++ % NAMES.length];
			String phone = PHONE_PREFIX + String.format("%04d", 1000 + nameIdx * 37 % 9000);
			LocalDate moveIn = today.minusMonths(6).minusDays(i * 14L);

			TenantResult created = createTenantUseCase.execute(new CreateTenantCommand(
				name, phone, room.getId().toString(), moveIn, null
			));
			changeTenantStatusUseCase.execute(new ChangeTenantStatusCommand(
				created.tenantId(), TenantStatus.MOVED_OUT
			));
		}

		log.info("[TenantDevSeeder] 시드 완료 — ACTIVE {}, RESERVED {}, MOVED_OUT {}",
			occupiedRooms.size(), reservedRooms.size(), historicalCount);
	}
}
