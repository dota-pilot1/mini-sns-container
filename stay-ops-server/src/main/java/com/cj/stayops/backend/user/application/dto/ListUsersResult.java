package com.cj.stayops.backend.user.application.dto;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;

import com.cj.stayops.backend.user.domain.model.User;

/**
 * 유저 목록 조회 결과 DTO.
 * <p>
 * passwordHash 같은 민감 필드는 담지 않는다 (도메인 → DTO 경계에서 필터링).
 */
public record ListUsersResult(
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
	) {
		public static Item from(User user) {
			return new Item(
				user.id().asString(),
				user.email().value(),
				user.name(),
				user.createdAt()
			);
		}
	}

	public static ListUsersResult from(Page<User> page) {
		List<Item> items = page.getContent().stream().map(Item::from).toList();
		return new ListUsersResult(
			items,
			page.getNumber(),
			page.getSize(),
			page.getTotalElements(),
			page.getTotalPages()
		);
	}
}
