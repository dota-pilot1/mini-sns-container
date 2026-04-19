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
import com.cj.stayops.backend.payment.domain.repository.PaymentRepository;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

/**
 * 계약 완전 삭제. 결제 레코드도 cascade 로 함께 hard-delete.
 * <p>
 * "잘못 입력한 계약 복구" 시나리오용. 정상 종료는 {@link TerminateContractUseCase} 사용.
 * 삭제로 인해 방의 다른 ACTIVE 계약이 사라지면 Room 상태도 VACANT 로 되돌린다.
 */
@Service
public class DeleteContractUseCase {

	private final ContractRepository contractRepository;
	private final PaymentRepository paymentRepository;
	private final RoomRepository roomRepository;
	private final Clock clock;

	public DeleteContractUseCase(ContractRepository contractRepository,
								 PaymentRepository paymentRepository,
								 RoomRepository roomRepository,
								 Clock clock) {
		this.contractRepository = contractRepository;
		this.paymentRepository = paymentRepository;
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	@Transactional
	public void execute(String contractId) {
		ContractId id = ContractId.of(contractId);
		Contract contract = contractRepository.findById(id)
			.orElseThrow(() -> new ContractNotFoundException(contractId));

		paymentRepository.deleteByContractId(id.value());
		contractRepository.deleteById(id);

		releaseRoomIfNoOtherActive(contract.roomId(), id);
	}

	private void releaseRoomIfNoOtherActive(java.util.UUID roomId, ContractId deletedId) {
		boolean hasOtherActive = contractRepository
			.findAll(null, roomId, ContractStatus.ACTIVE).stream()
			.anyMatch(c -> !c.id().equals(deletedId));
		if (hasOtherActive) {
			return;
		}
		roomRepository.findById(RoomId.of(roomId)).ifPresent(room -> {
			if (room.status() == RoomStatus.OCCUPIED) {
				roomRepository.save(room.changeStatus(RoomStatus.VACANT, Instant.now(clock)));
			}
		});
	}
}
