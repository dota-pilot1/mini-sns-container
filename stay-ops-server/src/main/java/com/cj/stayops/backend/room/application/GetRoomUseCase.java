package com.cj.stayops.backend.room.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.room.application.dto.RoomResult;
import com.cj.stayops.backend.room.domain.exception.RoomNotFoundException;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

@Service
public class GetRoomUseCase {

	private final RoomRepository roomRepository;

	public GetRoomUseCase(RoomRepository roomRepository) {
		this.roomRepository = roomRepository;
	}

	@Transactional(readOnly = true)
	public RoomResult execute(String roomId) {
		Room room = roomRepository.findById(RoomId.of(roomId))
			.orElseThrow(() -> new RoomNotFoundException(roomId));
		return RoomResult.from(room);
	}
}
