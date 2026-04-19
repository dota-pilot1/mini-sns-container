package com.cj.stayops.backend.room.application;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.room.application.dto.RoomImageResult;
import com.cj.stayops.backend.room.domain.exception.RoomImageNotFoundException;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomImage;
import com.cj.stayops.backend.room.domain.model.RoomImageId;
import com.cj.stayops.backend.room.domain.repository.RoomImageRepository;

/**
 * 같은 Room 안의 다른 이미지는 primary=false 로 내리고, 대상만 primary=true 로 승격.
 */
@Service
public class SetPrimaryRoomImageUseCase {

	private final RoomImageRepository roomImageRepository;

	public SetPrimaryRoomImageUseCase(RoomImageRepository roomImageRepository) {
		this.roomImageRepository = roomImageRepository;
	}

	@Transactional
	public RoomImageResult execute(String roomIdStr, String imageIdStr) {
		RoomId roomId = RoomId.of(roomIdStr);
		RoomImageId imageId = RoomImageId.of(imageIdStr);

		RoomImage target = roomImageRepository.findById(imageId)
			.orElseThrow(() -> new RoomImageNotFoundException(imageIdStr));

		if (!target.roomId().equals(roomId)) {
			throw new RoomImageNotFoundException(imageIdStr);
		}

		List<RoomImage> all = roomImageRepository.findAllByRoomId(roomId);
		List<RoomImage> updated = new ArrayList<>(all.size());
		RoomImage newPrimary = target;

		for (RoomImage img : all) {
			if (img.id().equals(target.id())) {
				newPrimary = img.withPrimary(true);
				updated.add(newPrimary);
			} else if (img.isPrimary()) {
				updated.add(img.withPrimary(false));
			}
		}

		if (!updated.isEmpty()) {
			roomImageRepository.saveAll(updated);
		}

		return RoomImageResult.from(newPrimary);
	}
}
