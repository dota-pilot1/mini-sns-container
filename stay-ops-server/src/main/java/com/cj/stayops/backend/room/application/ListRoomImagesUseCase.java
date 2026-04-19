package com.cj.stayops.backend.room.application;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.room.application.dto.RoomImageResult;
import com.cj.stayops.backend.room.domain.exception.RoomNotFoundException;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.repository.RoomImageRepository;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

@Service
public class ListRoomImagesUseCase {

	private final RoomRepository roomRepository;
	private final RoomImageRepository roomImageRepository;

	public ListRoomImagesUseCase(RoomRepository roomRepository, RoomImageRepository roomImageRepository) {
		this.roomRepository = roomRepository;
		this.roomImageRepository = roomImageRepository;
	}

	@Transactional(readOnly = true)
	public List<RoomImageResult> execute(String roomIdStr) {
		RoomId roomId = RoomId.of(roomIdStr);
		if (roomRepository.findById(roomId).isEmpty()) {
			throw new RoomNotFoundException(roomIdStr);
		}
		return roomImageRepository.findAllByRoomId(roomId).stream()
			.map(RoomImageResult::from)
			.toList();
	}
}
