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
import com.cj.stayops.backend.room.infrastructure.persistence.RoomJpaRepository;

/**
 * 개발 환경용 방 시드 데이터 러너.
 * <p>
 * 실제 현장 기준: 전원 1인실, 45개, 6~7층, 2.5~3.5평, 월세 35~53만원.
 * {@code stay-ops.dev.seed-rooms=true} 이고 DB에 방이 한 건도 없을 때만 45개(6층 22 + 7층 23)를 삽입한다.
 * 값은 결정적 규칙 기반으로 생성되어 재시드 시 동일한 데이터가 만들어진다.
 */
@Component
@ConditionalOnProperty(prefix = "stay-ops.dev", name = "seed-rooms", havingValue = "true")
public class RoomDevSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(RoomDevSeeder.class);

	private static final int FLOOR_6_COUNT = 22;
	private static final int FLOOR_7_COUNT = 23;

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

		log.info("[RoomDevSeeder] 방 {}개 시드 시작 (6층 {}개 + 7층 {}개)",
			FLOOR_6_COUNT + FLOOR_7_COUNT, FLOOR_6_COUNT, FLOOR_7_COUNT);
		seedFloor(6, FLOOR_6_COUNT);
		seedFloor(7, FLOOR_7_COUNT);
		log.info("[RoomDevSeeder] 시드 완료");
	}

	private void seedFloor(int floor, int count) {
		int baseRent = floor == 7 ? 380_000 : 350_000; // 7층 살짝 비쌈
		for (int i = 1; i <= count; i++) {
			int globalIdx = (floor - 6) * 100 + (i - 1);
			String roomNumber = (floor * 100 + i) + ""; // "601", "602", ...

			BigDecimal size = pickSize(i);                  // 2.5 ~ 3.5평
			long rent = baseRent + (i % 10) * 15_000L;      // 35만~53만 범위
			long deposit = 1_000_000L + (i % 3) * 500_000L; // 100만 ~ 200만
			Set<RoomOption> options = pickOptions(i);

			var created = createRoomUseCase.execute(new CreateRoomCommand(
				roomNumber, floor, size, rent, deposit, options, null
			));

			RoomStatus target = pickStatus(globalIdx);
			if (target != RoomStatus.VACANT) {
				changeRoomStatusUseCase.execute(new ChangeRoomStatusCommand(created.roomId(), target));
			}
		}
	}

	/** 2.5 ~ 3.5평 범위 분포. */
	private static BigDecimal pickSize(int i) {
		int mod = i % 5;
		return switch (mod) {
			case 0 -> BigDecimal.valueOf(3.5);
			case 1 -> BigDecimal.valueOf(2.5);
			case 2 -> BigDecimal.valueOf(2.8);
			case 3 -> BigDecimal.valueOf(3.0);
			default -> BigDecimal.valueOf(3.2);
		};
	}

	private static Set<RoomOption> pickOptions(int i) {
		EnumSet<RoomOption> opts = EnumSet.of(RoomOption.AIRCON, RoomOption.WINDOW);
		if (i % 3 == 0) opts.add(RoomOption.PRIVATE_BATH);
		if (i % 2 == 0) opts.add(RoomOption.REFRIGERATOR);
		if (i % 5 == 0) opts.add(RoomOption.DESK);
		return opts;
	}

	/** 10개 주기: VACANT 6, OCCUPIED 2, RESERVED 1, CLEANING 1. 별도 주기로 MAINTENANCE. */
	private static RoomStatus pickStatus(int idx) {
		if (idx % 17 == 0) return RoomStatus.MAINTENANCE;
		int mod = idx % 10;
		if (mod < 6) return RoomStatus.VACANT;
		if (mod < 8) return RoomStatus.OCCUPIED;
		if (mod == 8) return RoomStatus.RESERVED;
		return RoomStatus.CLEANING;
	}
}
