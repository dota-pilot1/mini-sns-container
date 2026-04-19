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
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

/**
 * 계약 중도 취소 (퇴실 처리).
 * <p>
 * endDate 를 취소일로 단축. 별도 status 필드는 없고, 날짜만 조정한다.
 * 이 방에 다른 유효 계약(오늘 기준 effective)이 없으면 Room 을 VACANT 로 되돌린다.
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

		LocalDate today = LocalDate.now(clock);
		LocalDate termination = cmd.terminationDate() == null ? today : cmd.terminationDate();

		Instant now = Instant.now(clock);
		Contract truncated = contract.truncateEndDate(termination, now);
		ContractResult result = ContractResult.from(contractRepository.save(truncated));

		releaseRoomIfNoOtherEffective(contract.roomId(), contract.id(), today, now);
		return result;
	}

	/**
	 * 방에 다른 유효 계약이 없으면 OCCUPIED → VACANT 로 되돌린다. 있으면 유지.
	 * 청소/문제 등 관리자가 수동 변경한 상태는 건드리지 않는다.
	 */
	private void releaseRoomIfNoOtherEffective(java.util.UUID roomId, ContractId terminatedId,
											   LocalDate today, Instant now) {
		boolean hasOtherEffective = contractRepository
			.findEffective(today, null, roomId).stream()
			.anyMatch(c -> !c.id().equals(terminatedId));
		if (hasOtherEffective) {
			return;
		}
		roomRepository.findById(RoomId.of(roomId)).ifPresent(room -> {
			if (room.status() == RoomStatus.OCCUPIED) {
				roomRepository.save(room.changeStatus(RoomStatus.VACANT, now));
			}
		});
	}
}
