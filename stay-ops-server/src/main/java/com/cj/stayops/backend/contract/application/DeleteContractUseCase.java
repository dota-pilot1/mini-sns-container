package com.cj.stayops.backend.contract.application;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.domain.exception.ContractNotFoundException;
import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.model.ContractStatus;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

/**
 * 계약 소프트 삭제 — {@code deletedAt} 만 찍고 로우는 보존한다.
 * <p>
 * "잘못 입력한 계약 교정" 시나리오 전용. 정상 종료(퇴실)는 {@link TerminateContractUseCase}.
 * 관련 결제 레코드는 그대로 두지만 조회 쿼리에서 계약 deletedAt 필터로 자동 제외된다.
 * 삭제로 인해 방의 다른 ACTIVE 계약이 없으면 Room 상태도 VACANT 로 되돌린다.
 */
@Service
public class DeleteContractUseCase {

	private final ContractRepository contractRepository;
	private final RoomRepository roomRepository;
	private final Clock clock;

	public DeleteContractUseCase(ContractRepository contractRepository,
								 RoomRepository roomRepository,
								 Clock clock) {
		this.contractRepository = contractRepository;
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	@Transactional
	public void execute(String contractId) {
		ContractId id = ContractId.of(contractId);
		Contract contract = contractRepository.findById(id)
			.orElseThrow(() -> new ContractNotFoundException(contractId));

		Instant now = Instant.now(clock);
		contractRepository.save(contract.softDelete(now));

		releaseRoomIfNoOtherActive(contract.roomId(), id, now);
	}

	private void releaseRoomIfNoOtherActive(java.util.UUID roomId, ContractId deletedId, Instant now) {
		boolean hasOtherActive = contractRepository
			.findAll(null, roomId, ContractStatus.ACTIVE).stream()
			.anyMatch(c -> !c.id().equals(deletedId));
		if (hasOtherActive) {
			return;
		}
		roomRepository.findById(RoomId.of(roomId)).ifPresent(room -> {
			if (room.status() == RoomStatus.OCCUPIED) {
				roomRepository.save(room.changeStatus(RoomStatus.VACANT, now));
			}
		});
	}
}
