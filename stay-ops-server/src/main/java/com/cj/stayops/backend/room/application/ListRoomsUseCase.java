package com.cj.stayops.backend.room.application;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.room.application.dto.ListRoomsQuery;
import com.cj.stayops.backend.room.application.dto.RoomResult;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

@Service
public class ListRoomsUseCase {

	private final RoomRepository roomRepository;

	public ListRoomsUseCase(RoomRepository roomRepository) {
		this.roomRepository = roomRepository;
	}

	@Transactional(readOnly = true)
	public List<RoomResult> execute(ListRoomsQuery query) {
		return roomRepository.findAll(query.floor(), query.status(), query.roomType())
			.stream()
			.map(RoomResult::from)
			.toList();
	}
}
