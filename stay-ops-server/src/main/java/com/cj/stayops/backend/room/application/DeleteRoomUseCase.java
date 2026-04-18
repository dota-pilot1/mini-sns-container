package com.cj.stayops.backend.room.application;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.room.domain.exception.RoomNotFoundException;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

@Service
public class DeleteRoomUseCase {

	private final RoomRepository roomRepository;
	private final Clock clock;

	public DeleteRoomUseCase(RoomRepository roomRepository, Clock clock) {
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	@Transactional
	public void execute(String roomId) {
		RoomId id = RoomId.of(roomId);
		Room room = roomRepository.findById(id)
			.orElseThrow(() -> new RoomNotFoundException(roomId));

		Room deleted = room.markDeleted(Instant.now(clock));
		roomRepository.save(deleted);
	}
}
