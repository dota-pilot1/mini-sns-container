package com.cj.stayops.backend.room.application;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.room.application.dto.RoomResult;
import com.cj.stayops.backend.room.application.dto.UpdateRoomCommand;
import com.cj.stayops.backend.room.domain.exception.DuplicateRoomNumberException;
import com.cj.stayops.backend.room.domain.exception.RoomNotFoundException;
import com.cj.stayops.backend.room.domain.model.Money;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomNumber;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

@Service
public class UpdateRoomUseCase {

	private final RoomRepository roomRepository;
	private final Clock clock;

	public UpdateRoomUseCase(RoomRepository roomRepository, Clock clock) {
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	@Transactional
	public RoomResult execute(UpdateRoomCommand command) {
		RoomId id = RoomId.of(command.roomId());
		Room room = roomRepository.findById(id)
			.orElseThrow(() -> new RoomNotFoundException(command.roomId()));

		RoomNumber newRoomNumber = null;
		if (command.roomNumber() != null) {
			newRoomNumber = RoomNumber.of(command.roomNumber());
			if (!newRoomNumber.equals(room.roomNumber())
				&& roomRepository.existsByRoomNumber(newRoomNumber)) {
				throw new DuplicateRoomNumberException(newRoomNumber.value());
			}
		}

		Money newRent = command.monthlyRent() == null ? null : Money.of(command.monthlyRent(), "monthlyRent");
		Money newDeposit = command.deposit() == null ? null : Money.of(command.deposit(), "deposit");

		Room updated = room.update(
			newRoomNumber,
			command.floor(),
			command.sizePyeong(),
			newRent,
			newDeposit,
			command.options(),
			command.memo(),
			Instant.now(clock)
		);

		Room saved = roomRepository.save(updated);
		return RoomResult.from(saved);
	}
}
