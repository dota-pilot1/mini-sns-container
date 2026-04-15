package com.cj.stayops.backend.user.presentation.dto;

import java.time.Instant;
import java.util.List;

import com.cj.stayops.backend.user.application.dto.ListUsersResult;

/**
 * GET /api/users 응답 DTO.
 * <p>
 * Application의 ListUsersResult를 HTTP 응답 형태로 한번 더 감싼다.
 * (Application DTO와 Presentation DTO를 분리하여 HTTP 관심사 누수 방지)
 */
public record ListUsersResponse(
	List<Item> items,
	int page,
	int size,
	long totalElements,
	int totalPages
) {

	public record Item(
		String userId,
		String email,
		String name,
		Instant createdAt
	) { }

	public static ListUsersResponse from(ListUsersResult result) {
		List<Item> items = result.items().stream()
			.map(i -> new Item(i.userId(), i.email(), i.name(), i.createdAt()))
			.toList();
		return new ListUsersResponse(
			items,
			result.page(),
			result.size(),
			result.totalElements(),
			result.totalPages()
		);
	}
}
