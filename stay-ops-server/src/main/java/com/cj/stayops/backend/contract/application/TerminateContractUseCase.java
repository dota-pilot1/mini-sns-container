package com.cj.stayops.backend.contract.application;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.application.dto.TerminateContractCommand;
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
 * 계약 중도 종료 (퇴실 처리).
 */
@Service
public class TerminateContractUseCase {

	private final ContractRepository contractRepository;
	private final RoomRepository roomRepository;
	private final Clock clock;

	public TerminateContractUseCase(ContractRepository contractRepository,
									RoomRepository roomRepository,
									Clock clock) {
		this.contractRepository = contractRepository;
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	@Transactional
	public ContractResult execute(TerminateContractCommand cmd) {
		Contract contract = contractRepository.findById(ContractId.of(cmd.contractId()))
			.orElseThrow(() -> new ContractNotFoundException(cmd.contractId()));

		LocalDate termination = cmd.terminationDate() == null
			? LocalDate.now(clock)
			: cmd.terminationDate();

		Instant now = Instant.now(clock);
		Contract terminated = contract.terminate(termination, now);
		ContractResult result = ContractResult.from(contractRepository.save(terminated));

		releaseRoomIfNoOtherActive(contract.roomId(), contract.id(), now);
		return result;
	}

	/**
	 * 방의 다른 ACTIVE 계약이 없으면 OCCUPIED → VACANT 로 되돌린다. 다른 입주자가 있다면 유지.
	 * 청소/문제 등 관리자가 수동 변경한 상태는 건드리지 않는다.
	 */
	private void releaseRoomIfNoOtherActive(java.util.UUID roomId, ContractId terminatedId, Instant now) {
		boolean hasOtherActive = contractRepository
			.findAll(null, roomId, ContractStatus.ACTIVE).stream()
			.anyMatch(c -> !c.id().equals(terminatedId));
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
