package com.cj.stayops.backend.room.application;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.room.application.dto.CreateRoomCommand;
import com.cj.stayops.backend.room.application.dto.RoomResult;
import com.cj.stayops.backend.room.domain.exception.DuplicateRoomNumberException;
import com.cj.stayops.backend.room.domain.model.Money;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomNumber;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

@Service
public class CreateRoomUseCase {

	private final RoomRepository roomRepository;
	private final Clock clock;

	public CreateRoomUseCase(RoomRepository roomRepository, Clock clock) {
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	@Transactional
	public RoomResult execute(CreateRoomCommand command) {
		RoomNumber roomNumber = RoomNumber.of(command.roomNumber());

		if (roomRepository.existsByRoomNumber(roomNumber)) {
			throw new DuplicateRoomNumberException(roomNumber.value());
		}

		Money rent = Money.of(command.monthlyRent(), "monthlyRent");
		Money deposit = Money.of(command.deposit(), "deposit");
		Instant now = Instant.now(clock);

		Room room = Room.register(
			RoomId.generate(),
			roomNumber,
			command.floor(),
			command.sizePyeong(),
			command.roomType(),
			rent,
			deposit,
			command.options(),
			command.memo(),
			now
		);

		Room saved = roomRepository.save(room);
		return RoomResult.from(saved);
	}
}
