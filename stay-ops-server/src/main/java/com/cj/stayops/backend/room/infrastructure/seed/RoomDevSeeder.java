package com.cj.stayops.backend.room.infrastructure.seed;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.cj.stayops.backend.room.application.ChangeRoomStatusUseCase;
import com.cj.stayops.backend.room.application.CreateRoomUseCase;
import com.cj.stayops.backend.room.application.dto.ChangeRoomStatusCommand;
import com.cj.stayops.backend.room.application.dto.CreateRoomCommand;
import com.cj.stayops.backend.room.domain.model.RoomOption;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.model.RoomType;
import com.cj.stayops.backend.room.infrastructure.persistence.RoomJpaRepository;

/**
 * 개발 환경용 방 시드 데이터 러너.
 * <p>
 * {@code stay-ops.dev.seed-rooms=true} 이고 DB에 방이 한 건도 없을 때만 60개(6층/7층 각 30개)를 삽입한다.
 * 값은 결정적 규칙 기반으로 생성되어 재시드 시 동일한 데이터가 만들어진다.
 * <p>
 * CreateRoomUseCase 를 거치므로 도메인 검증 로직이 그대로 실행된다 (실제 API 와 동일한 품질).
 */
@Component
@ConditionalOnProperty(prefix = "stay-ops.dev", name = "seed-rooms", havingValue = "true")
public class RoomDevSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(RoomDevSeeder.class);

	private final RoomJpaRepository roomJpaRepository;
	private final CreateRoomUseCase createRoomUseCase;
	private final ChangeRoomStatusUseCase changeRoomStatusUseCase;

	public RoomDevSeeder(RoomJpaRepository roomJpaRepository,
						 CreateRoomUseCase createRoomUseCase,
						 ChangeRoomStatusUseCase changeRoomStatusUseCase) {
		this.roomJpaRepository = roomJpaRepository;
		this.createRoomUseCase = createRoomUseCase;
		this.changeRoomStatusUseCase = changeRoomStatusUseCase;
	}

	@Override
	public void run(org.springframework.boot.ApplicationArguments args) {
		long existing = roomJpaRepository.count();
		if (existing > 0) {
			log.info("[RoomDevSeeder] 기존 방 {}개 존재 → 시드 스킵", existing);
			return;
		}

		log.info("[RoomDevSeeder] 방 60개 시드 시작 (6층 601~630, 7층 701~730)");
		seedFloor(6);
		seedFloor(7);
		log.info("[RoomDevSeeder] 시드 완료");
	}

	private void seedFloor(int floor) {
		int baseRent = floor == 7 ? 380_000 : 350_000; // 7층이 살짝 비쌈
		for (int i = 1; i <= 30; i++) {
			int globalIdx = (floor - 6) * 30 + (i - 1); // 0..59
			String roomNumber = (floor * 100 + i) + ""; // "601", "602", ...

			RoomType type = pickType(globalIdx);
			BigDecimal size = pickSize(type, i);
			long rent = baseRent + (i % 10) * 15_000L;
			long deposit = 1_000_000L + (i % 4) * 500_000L; // 100만 ~ 250만
			Set<RoomOption> options = pickOptions(type, i);
			String memo = null;

			var created = createRoomUseCase.execute(new CreateRoomCommand(
				roomNumber, floor, size, type, rent, deposit, options, memo
			));

			// 기본 상태는 VACANT 이지만 일부를 다른 상태로 전환해 3-뷰(칸반) 데모 데이터 확보
			RoomStatus target = pickStatus(globalIdx);
			if (target != RoomStatus.VACANT) {
				changeRoomStatusUseCase.execute(new ChangeRoomStatusCommand(created.roomId(), target));
			}
		}
	}

	private static RoomType pickType(int idx) {
		if (idx % 20 == 0) return RoomType.FAMILY; // 5% (60개 중 3개)
		if (idx % 5 == 0)  return RoomType.DOUBLE; // 약 20%
		return RoomType.SINGLE;                     // 나머지
	}

	private static BigDecimal pickSize(RoomType type, int i) {
		return switch (type) {
			case SINGLE -> BigDecimal.valueOf(2.5 + (i % 3) * 0.3);    // 2.5 ~ 3.1
			case DOUBLE -> BigDecimal.valueOf(4.0 + (i % 3) * 0.5);    // 4.0 ~ 5.0
			case FAMILY -> BigDecimal.valueOf(6.5 + (i % 2) * 1.0);    // 6.5 ~ 7.5
		};
	}

	private static Set<RoomOption> pickOptions(RoomType type, int i) {
		EnumSet<RoomOption> opts = EnumSet.of(RoomOption.AIRCON, RoomOption.WINDOW);
		if (i % 3 == 0) opts.add(RoomOption.PRIVATE_BATH);
		if (i % 2 == 0) opts.add(RoomOption.REFRIGERATOR);
		if (i % 5 == 0) opts.add(RoomOption.DESK);
		if (type == RoomType.FAMILY) {
			opts.add(RoomOption.PRIVATE_BATH);
			opts.add(RoomOption.REFRIGERATOR);
			opts.add(RoomOption.DESK);
		}
		return opts;
	}

	/**
	 * 10개 주기 상태 분포: VACANT 6, OCCUPIED 2, RESERVED 1, CLEANING 1 → 약 MAINTENANCE 는 별도 주기.
	 */
	private static RoomStatus pickStatus(int idx) {
		if (idx % 17 == 0) return RoomStatus.MAINTENANCE; // ~3개
		int mod = idx % 10;
		if (mod < 6) return RoomStatus.VACANT;
		if (mod < 8) return RoomStatus.OCCUPIED;
		if (mod == 8) return RoomStatus.RESERVED;
		return RoomStatus.CLEANING;
	}
}
