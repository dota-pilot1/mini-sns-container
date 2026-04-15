package com.cj.stayops.backend.user.domain.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.cj.stayops.backend.user.domain.model.Email;
import com.cj.stayops.backend.user.domain.model.User;
import com.cj.stayops.backend.user.domain.model.UserId;

/**
 * User Aggregate Repository (도메인 계약).
 * <p>
 * 구현체는 Infrastructure Layer(JPA)에 위치한다.
 * 도메인 계층은 JPA/DB를 모른다 → 의존성 역전 원칙(DIP).
 */
public interface UserRepository {

	User save(User user);

	Optional<User> findById(UserId id);

	Optional<User> findByEmail(Email email);

	boolean existsByEmail(Email email);

	/**
	 * 페이징 조회. 정렬은 호출자가 Pageable로 지정한다.
	 */
	Page<User> findAll(Pageable pageable);
}
