package com.cj.stayops.backend.user.application.dto;

/**
 * 유저 목록 조회 쿼리.
 * <p>
 * 정렬은 v1에서 createdAt desc 고정 (Application Layer 내부에서 처리).
 * size는 상한(100) 적용.
 */
public record ListUsersQuery(int page, int size) {

	public static final int DEFAULT_SIZE = 20;
	public static final int MAX_SIZE = 100;

	public ListUsersQuery {
		if (page < 0) {
			page = 0;
		}
		if (size <= 0) {
			size = DEFAULT_SIZE;
		}
		if (size > MAX_SIZE) {
			size = MAX_SIZE;
		}
	}
}
