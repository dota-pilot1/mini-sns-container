package com.cj.stayops.backend.room.presentation;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cj.stayops.backend.auth.presentation.dto.ErrorResponse;
import com.cj.stayops.backend.config.aws.S3ObjectService;
import com.cj.stayops.backend.room.application.ChangeRoomStatusUseCase;
import com.cj.stayops.backend.room.application.CreateRoomUseCase;
import com.cj.stayops.backend.room.application.DeleteRoomUseCase;
import com.cj.stayops.backend.room.application.GetRoomUseCase;
import com.cj.stayops.backend.room.application.ListRoomsUseCase;
import com.cj.stayops.backend.room.application.UpdateRoomUseCase;
import com.cj.stayops.backend.room.application.dto.ListRoomsQuery;
import com.cj.stayops.backend.room.application.dto.RoomResult;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomImage;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.repository.RoomImageRepository;
import com.cj.stayops.backend.room.presentation.dto.ChangeRoomStatusRequest;
import com.cj.stayops.backend.room.presentation.dto.CreateRoomRequest;
import com.cj.stayops.backend.room.presentation.dto.RoomResponse;
import com.cj.stayops.backend.room.presentation.dto.UpdateRoomRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

/**
 * 방(Room) 관리 API.
 */
@RestController
@RequestMapping("/api/rooms")
@Tag(name = "Room", description = "방(Room) 관리 API")
public class RoomController {

	private final CreateRoomUseCase createRoomUseCase;
	private final UpdateRoomUseCase updateRoomUseCase;
	private final ChangeRoomStatusUseCase changeRoomStatusUseCase;
	private final GetRoomUseCase getRoomUseCase;
	private final ListRoomsUseCase listRoomsUseCase;
	private final DeleteRoomUseCase deleteRoomUseCase;
	private final RoomImageRepository roomImageRepository;
	private final S3ObjectService s3ObjectService;

	public RoomController(CreateRoomUseCase createRoomUseCase,
						  UpdateRoomUseCase updateRoomUseCase,
						  ChangeRoomStatusUseCase changeRoomStatusUseCase,
						  GetRoomUseCase getRoomUseCase,
						  ListRoomsUseCase listRoomsUseCase,
						  DeleteRoomUseCase deleteRoomUseCase,
						  RoomImageRepository roomImageRepository,
						  S3ObjectService s3ObjectService) {
		this.createRoomUseCase = createRoomUseCase;
		this.updateRoomUseCase = updateRoomUseCase;
		this.changeRoomStatusUseCase = changeRoomStatusUseCase;
		this.getRoomUseCase = getRoomUseCase;
		this.listRoomsUseCase = listRoomsUseCase;
		this.deleteRoomUseCase = deleteRoomUseCase;
		this.roomImageRepository = roomImageRepository;
		this.s3ObjectService = s3ObjectService;
	}

	@PostMapping
	@Operation(summary = "방 등록", description = "새 방을 등록합니다. 호수는 시스템 내 유일해야 합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "201", description = "등록 성공",
			content = @Content(schema = @Schema(implementation = RoomResponse.class))),
		@ApiResponse(responseCode = "400", description = "형식 오류",
			content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
		@ApiResponse(responseCode = "409", description = "호수 중복",
			content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
	})
	public ResponseEntity<RoomResponse> create(@Valid @RequestBody CreateRoomRequest request) {
		RoomResult result = createRoomUseCase.execute(request.toCommand());
		return ResponseEntity.status(HttpStatus.CREATED).body(RoomResponse.from(result));
	}

	@GetMapping
	@Operation(summary = "방 목록 조회", description = "필터 조건(층/상태)으로 방 목록을 조회합니다. 삭제된 방은 제외됩니다. 각 항목에 대표 이미지 URL 포함.")
	public ResponseEntity<List<RoomResponse>> list(
		@RequestParam(required = false) Integer floor,
		@RequestParam(required = false) RoomStatus status
	) {
		List<RoomResult> results = listRoomsUseCase.execute(new ListRoomsQuery(floor, status));
		// 대표 이미지를 한 번에 조회해 N+1 방지.
		List<RoomId> roomIds = results.stream().map(r -> RoomId.of(r.roomId())).toList();
		Map<RoomId, RoomImage> primaryByRoomId = roomImageRepository.findPrimaryByRoomIds(roomIds);

		List<RoomResponse> items = results.stream()
			.map(r -> {
				RoomImage primary = primaryByRoomId.get(RoomId.of(r.roomId()));
				String url = primary == null ? null : s3ObjectService.presignGetUrl(primary.s3Key());
				return RoomResponse.from(r, url);
			})
			.toList();
		return ResponseEntity.ok(items);
	}

	@GetMapping("/{roomId}")
	@Operation(summary = "방 상세 조회")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "조회 성공"),
		@ApiResponse(responseCode = "404", description = "방 없음",
			content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
	})
	public ResponseEntity<RoomResponse> get(@PathVariable String roomId) {
		RoomResult result = getRoomUseCase.execute(roomId);
		return ResponseEntity.ok(RoomResponse.from(result));
	}

	@PatchMapping("/{roomId}")
	@Operation(summary = "방 정보 수정", description = "null 필드는 변경하지 않습니다 (PATCH 시맨틱).")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "수정 성공"),
		@ApiResponse(responseCode = "400", description = "형식 오류"),
		@ApiResponse(responseCode = "404", description = "방 없음"),
		@ApiResponse(responseCode = "409", description = "호수 중복")
	})
	public ResponseEntity<RoomResponse> update(
		@PathVariable String roomId,
		@Valid @RequestBody UpdateRoomRequest request
	) {
		RoomResult result = updateRoomUseCase.execute(request.toCommand(roomId));
		return ResponseEntity.ok(RoomResponse.from(result));
	}

	@PatchMapping("/{roomId}/status")
	@Operation(summary = "방 상태 변경")
	public ResponseEntity<RoomResponse> changeStatus(
		@PathVariable String roomId,
		@Valid @RequestBody ChangeRoomStatusRequest request
	) {
		RoomResult result = changeRoomStatusUseCase.execute(request.toCommand(roomId));
		return ResponseEntity.ok(RoomResponse.from(result));
	}

	@DeleteMapping("/{roomId}")
	@Operation(summary = "방 삭제 (soft)", description = "실제로는 deleted_at 을 세팅하며 DB에서 제거되지 않습니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "204", description = "삭제 성공"),
		@ApiResponse(responseCode = "404", description = "방 없음")
	})
	public ResponseEntity<Void> delete(@PathVariable String roomId) {
		deleteRoomUseCase.execute(roomId);
		return ResponseEntity.noContent().build();
	}
}
