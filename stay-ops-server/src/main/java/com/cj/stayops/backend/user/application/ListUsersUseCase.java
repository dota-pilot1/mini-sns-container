package com.cj.stayops.backend.user.application;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.user.application.dto.ListUsersQuery;
import com.cj.stayops.backend.user.application.dto.ListUsersResult;
import com.cj.stayops.backend.user.domain.model.User;
import com.cj.stayops.backend.user.domain.repository.UserRepository;

/**
 * 유저 목록 조회 유스케이스.
 * <p>
 * v1: createdAt desc 고정 정렬, 페이징만 지원.
 * 검색/필터/유저 상세는 v2 이후.
 */
@Service
public class ListUsersUseCase {

	private final UserRepository userRepository;

	public ListUsersUseCase(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public ListUsersResult execute(ListUsersQuery query) {
		// 정렬 키는 JPA Entity 필드명("createdAt") 기준
		Pageable pageable = PageRequest.of(
			query.page(),
			query.size(),
			Sort.by(Sort.Direction.DESC, "createdAt")
		);

		Page<User> page = userRepository.findAll(pageable);
		return ListUsersResult.from(page);
	}
}
