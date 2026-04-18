package com.cj.stayops.backend.room.application;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.room.application.dto.ChangeRoomStatusCommand;
import com.cj.stayops.backend.room.application.dto.RoomResult;
import com.cj.stayops.backend.room.domain.exception.RoomNotFoundException;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

@Service
public class ChangeRoomStatusUseCase {

	private final RoomRepository roomRepository;
	private final Clock clock;

	public ChangeRoomStatusUseCase(RoomRepository roomRepository, Clock clock) {
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	@Transactional
	public RoomResult execute(ChangeRoomStatusCommand command) {
		RoomId id = RoomId.of(command.roomId());
		Room room = roomRepository.findById(id)
			.orElseThrow(() -> new RoomNotFoundException(command.roomId()));

		Room updated = room.changeStatus(command.newStatus(), Instant.now(clock));
		Room saved = roomRepository.save(updated);
		return RoomResult.from(saved);
	}
}
