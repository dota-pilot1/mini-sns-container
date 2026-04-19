package com.cj.stayops.backend.room.application;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.config.aws.S3ObjectService;
import com.cj.stayops.backend.room.application.dto.RoomImageResult;
import com.cj.stayops.backend.room.domain.exception.ImageNotUploadedException;
import com.cj.stayops.backend.room.domain.exception.RoomNotFoundException;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomImage;
import com.cj.stayops.backend.room.domain.model.RoomImageId;
import com.cj.stayops.backend.room.domain.repository.RoomImageRepository;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

import software.amazon.awssdk.services.s3.model.HeadObjectResponse;

/**
 * presign 으로 업로드가 끝난 S3 key 를 DB 에 등록.
 * <p>
 * - HeadObject 로 실제 업로드 여부·contentType·size 확인
 * - 첫 이미지면 자동으로 대표(primary) 설정
 */
@Service
public class RegisterRoomImageUseCase {

	private final RoomRepository roomRepository;
	private final RoomImageRepository roomImageRepository;
	private final S3ObjectService s3ObjectService;
	private final Clock clock;

	public RegisterRoomImageUseCase(RoomRepository roomRepository,
									RoomImageRepository roomImageRepository,
									S3ObjectService s3ObjectService,
									Clock clock) {
		this.roomRepository = roomRepository;
		this.roomImageRepository = roomImageRepository;
		this.s3ObjectService = s3ObjectService;
		this.clock = clock;
	}

	@Transactional
	public RoomImageResult execute(String roomIdStr, String s3Key) {
		RoomId roomId = RoomId.of(roomIdStr);
		if (roomRepository.findById(roomId).isEmpty()) {
			throw new RoomNotFoundException(roomIdStr);
		}

		HeadObjectResponse head = s3ObjectService.head(s3Key)
			.orElseThrow(() -> new ImageNotUploadedException(s3Key));

		long count = roomImageRepository.countByRoomId(roomId);
		int nextSortOrder = roomImageRepository.maxSortOrderByRoomId(roomId) + 1;
		boolean primary = count == 0;

		RoomImage image = RoomImage.register(
			RoomImageId.generate(),
			roomId,
			s3Key,
			head.contentType(),
			head.contentLength() == null ? 0L : head.contentLength(),
			nextSortOrder,
			primary,
			Instant.now(clock)
		);

		return RoomImageResult.from(roomImageRepository.save(image));
	}
}
