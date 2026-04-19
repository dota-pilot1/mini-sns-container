package com.cj.stayops.backend.room.presentation;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cj.stayops.backend.config.aws.S3ObjectService;
import com.cj.stayops.backend.room.application.DeleteRoomImageUseCase;
import com.cj.stayops.backend.room.application.ListRoomImagesUseCase;
import com.cj.stayops.backend.room.application.RegisterRoomImageUseCase;
import com.cj.stayops.backend.room.application.SetPrimaryRoomImageUseCase;
import com.cj.stayops.backend.room.application.dto.RoomImageResult;
import com.cj.stayops.backend.room.presentation.dto.RegisterRoomImageRequest;
import com.cj.stayops.backend.room.presentation.dto.RoomImageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/rooms/{roomId}/images")
@Tag(name = "RoomImage", description = "방 이미지 관리 API")
public class RoomImageController {

	private final RegisterRoomImageUseCase registerUseCase;
	private final ListRoomImagesUseCase listUseCase;
	private final DeleteRoomImageUseCase deleteUseCase;
	private final SetPrimaryRoomImageUseCase setPrimaryUseCase;
	private final S3ObjectService s3ObjectService;

	public RoomImageController(RegisterRoomImageUseCase registerUseCase,
							   ListRoomImagesUseCase listUseCase,
							   DeleteRoomImageUseCase deleteUseCase,
							   SetPrimaryRoomImageUseCase setPrimaryUseCase,
							   S3ObjectService s3ObjectService) {
		this.registerUseCase = registerUseCase;
		this.listUseCase = listUseCase;
		this.deleteUseCase = deleteUseCase;
		this.setPrimaryUseCase = setPrimaryUseCase;
		this.s3ObjectService = s3ObjectService;
	}

	@PostMapping
	@Operation(summary = "이미지 등록", description = "presign 후 S3 업로드가 끝난 key 를 DB 에 등록한다.")
	public ResponseEntity<RoomImageResponse> register(
		@PathVariable String roomId,
		@Valid @RequestBody RegisterRoomImageRequest request
	) {
		RoomImageResult result = registerUseCase.execute(roomId, request.s3Key());
		return ResponseEntity.status(HttpStatus.CREATED)
			.body(RoomImageResponse.from(result, s3ObjectService));
	}

	@GetMapping
	@Operation(summary = "이미지 목록 조회", description = "sortOrder ASC 순으로 반환. url 은 presigned GET URL.")
	public ResponseEntity<List<RoomImageResponse>> list(@PathVariable String roomId) {
		List<RoomImageResponse> items = listUseCase.execute(roomId).stream()
			.map(r -> RoomImageResponse.from(r, s3ObjectService))
			.toList();
		return ResponseEntity.ok(items);
	}

	@DeleteMapping("/{imageId}")
	@Operation(summary = "이미지 삭제")
	public ResponseEntity<Void> delete(@PathVariable String roomId, @PathVariable String imageId) {
		deleteUseCase.execute(roomId, imageId);
		return ResponseEntity.noContent().build();
	}

	@PatchMapping("/{imageId}/primary")
	@Operation(summary = "대표 이미지 지정")
	public ResponseEntity<RoomImageResponse> setPrimary(
		@PathVariable String roomId,
		@PathVariable String imageId
	) {
		RoomImageResult result = setPrimaryUseCase.execute(roomId, imageId);
		return ResponseEntity.ok(RoomImageResponse.from(result, s3ObjectService));
	}
}
