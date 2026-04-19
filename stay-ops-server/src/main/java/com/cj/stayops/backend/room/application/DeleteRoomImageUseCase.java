package com.cj.stayops.backend.room.application;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.config.aws.S3ObjectService;
import com.cj.stayops.backend.room.domain.exception.RoomImageNotFoundException;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomImage;
import com.cj.stayops.backend.room.domain.model.RoomImageId;
import com.cj.stayops.backend.room.domain.repository.RoomImageRepository;

/**
 * 이미지 삭제. DB 에서 제거 후 S3 에서도 제거한다.
 * 삭제 대상이 대표였다면 남은 이미지 중 sortOrder 가장 작은 것을 대표로 승격.
 */
@Service
public class DeleteRoomImageUseCase {

	private static final Logger log = LoggerFactory.getLogger(DeleteRoomImageUseCase.class);

	private final RoomImageRepository roomImageRepository;
	private final S3ObjectService s3ObjectService;

	public DeleteRoomImageUseCase(RoomImageRepository roomImageRepository, S3ObjectService s3ObjectService) {
		this.roomImageRepository = roomImageRepository;
		this.s3ObjectService = s3ObjectService;
	}

	@Transactional
	public void execute(String roomIdStr, String imageIdStr) {
		RoomId roomId = RoomId.of(roomIdStr);
		RoomImageId imageId = RoomImageId.of(imageIdStr);

		RoomImage target = roomImageRepository.findById(imageId)
			.orElseThrow(() -> new RoomImageNotFoundException(imageIdStr));

		if (!target.roomId().equals(roomId)) {
			// 해당 방 소속이 아니면 404 로 동일 취급 (정보 누출 방지).
			throw new RoomImageNotFoundException(imageIdStr);
		}

		String keyToRemove = target.s3Key();
		boolean wasPrimary = target.isPrimary();

		roomImageRepository.delete(target);

		if (wasPrimary) {
			// 남은 이미지 중 첫 번째를 대표로 승격.
			List<RoomImage> remaining = roomImageRepository.findAllByRoomId(roomId);
			Optional<RoomImage> next = remaining.stream().findFirst();
			next.ifPresent(img -> roomImageRepository.save(img.withPrimary(true)));
		}

		// S3 삭제는 트랜잭션 밖이 이상적이지만 Spring 기본 설정상 메서드 종료 후 커밋됨.
		// 실패해도 DB 정합성은 유지되므로 로그만 남기고 계속 진행.
		try {
			s3ObjectService.delete(keyToRemove);
		} catch (Exception e) {
			log.warn("S3 deleteObject failed (orphan 가능). key={}, reason={}", keyToRemove, e.getMessage());
		}
	}
}
