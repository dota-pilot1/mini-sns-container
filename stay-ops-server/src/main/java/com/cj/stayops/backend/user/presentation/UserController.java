package com.cj.stayops.backend.user.presentation;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cj.stayops.backend.user.application.ListUsersUseCase;
import com.cj.stayops.backend.user.application.dto.ListUsersQuery;
import com.cj.stayops.backend.user.application.dto.ListUsersResult;
import com.cj.stayops.backend.user.presentation.dto.ListUsersResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 유저 조회 API Controller.
 * <p>
 * v1: 페이징 목록 조회만 지원. 상세/수정/검색은 v2 이후.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "User", description = "유저 조회 API")
public class UserController {

	private final ListUsersUseCase listUsersUseCase;

	public UserController(ListUsersUseCase listUsersUseCase) {
		this.listUsersUseCase = listUsersUseCase;
	}

	@GetMapping
	@Operation(
		summary = "유저 목록 조회",
		description = "createdAt 내림차순으로 페이징된 유저 목록을 반환합니다. size 상한 100."
	)
	@ApiResponses({
		@ApiResponse(
			responseCode = "200",
			description = "조회 성공",
			content = @Content(schema = @Schema(implementation = ListUsersResponse.class))
		)
	})
	public ResponseEntity<ListUsersResponse> list(
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "20") int size
	) {
		ListUsersResult result = listUsersUseCase.execute(new ListUsersQuery(page, size));
		return ResponseEntity.ok(ListUsersResponse.from(result));
	}
}
