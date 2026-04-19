package com.cj.stayops.backend.contract.application;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.application.dto.CreateContractCommand;
import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;
import com.cj.stayops.backend.room.domain.exception.RoomNotFoundException;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;
import com.cj.stayops.backend.tenant.domain.exception.TenantNotFoundException;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

@Service
public class CreateContractUseCase {

	private final ContractRepository contractRepository;
	private final TenantRepository tenantRepository;
	private final RoomRepository roomRepository;
	private final Clock clock;

	public CreateContractUseCase(ContractRepository contractRepository,
								 TenantRepository tenantRepository,
								 RoomRepository roomRepository,
								 Clock clock) {
		this.contractRepository = contractRepository;
		this.tenantRepository = tenantRepository;
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	@Transactional
	public ContractResult execute(CreateContractCommand cmd) {
		TenantId tenantId = TenantId.of(cmd.tenantId());
		tenantRepository.findById(tenantId)
			.orElseThrow(() -> new TenantNotFoundException(cmd.tenantId()));

		RoomId roomId = RoomId.of(cmd.roomId());
		Room room = roomRepository.findById(roomId)
			.orElseThrow(() -> new RoomNotFoundException(cmd.roomId()));

		Instant now = Instant.now(clock);
		Contract contract = Contract.create(
			ContractId.generate(),
			tenantId.value(),
			roomId.value(),
			cmd.startDate(),
			cmd.endDate(),
			cmd.monthlyRent(),
			cmd.deposit(),
			now
		);
		ContractResult result = ContractResult.from(contractRepository.save(contract));

		if (room.status() != RoomStatus.OCCUPIED) {
			roomRepository.save(room.changeStatus(RoomStatus.OCCUPIED, now));
		}
		return result;
	}
}
