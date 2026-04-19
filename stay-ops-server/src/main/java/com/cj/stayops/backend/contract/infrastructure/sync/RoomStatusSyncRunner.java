package com.cj.stayops.backend.contract.infrastructure.sync;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

/**
 * 부팅 시 1회: ACTIVE 계약과 Room.status 일관성 보정.
 * <p>
 * - ACTIVE 계약이 걸린 방인데 status 가 OCCUPIED 가 아니면 OCCUPIED 로 변경 (단, MAINTENANCE/CLEANING/RESERVED 는 관리자 의도이므로 건드리지 않음 — VACANT 만 강제 보정).
 * - 반대로 OCCUPIED 인데 ACTIVE 계약이 하나도 없는 방은 VACANT 로 되돌림.
 * <p>
 * 이전 버전에서 입주 처리 시 Room 상태 동기화가 누락되어 어긋난 데이터를 한 번에 정리하기 위함.
 * Room/Tenant 시더보다 늦게 돌도록 Order 큰 값 사용.
 */
@Component
@Order(1000)
public class RoomStatusSyncRunner implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(RoomStatusSyncRunner.class);

	private final ContractRepository contractRepository;
	private final RoomRepository roomRepository;
	private final Clock clock;

	public RoomStatusSyncRunner(ContractRepository contractRepository,
								RoomRepository roomRepository,
								Clock clock) {
		this.contractRepository = contractRepository;
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	@Override
	@Transactional
	public void run(org.springframework.boot.ApplicationArguments args) {
		Instant now = Instant.now(clock);
		LocalDate today = LocalDate.now(clock);
		Set<UUID> activeRoomIds = new HashSet<>();
		for (Contract c : contractRepository.findEffective(today, null, null)) {
			activeRoomIds.add(c.roomId());
		}

		int promoted = 0;
		for (UUID roomId : activeRoomIds) {
			Room room = roomRepository.findById(RoomId.of(roomId)).orElse(null);
			if (room == null) continue;
			if (room.status() == RoomStatus.VACANT) {
				roomRepository.save(room.changeStatus(RoomStatus.OCCUPIED, now));
				promoted++;
			}
		}

		int released = 0;
		for (Room room : roomRepository.findAll(null, RoomStatus.OCCUPIED)) {
			if (!activeRoomIds.contains(room.id().value())) {
				roomRepository.save(room.changeStatus(RoomStatus.VACANT, now));
				released++;
			}
		}

		if (promoted > 0 || released > 0) {
			log.info("RoomStatusSync: promoted {} VACANT→OCCUPIED, released {} OCCUPIED→VACANT",
				promoted, released);
		}
	}
}
