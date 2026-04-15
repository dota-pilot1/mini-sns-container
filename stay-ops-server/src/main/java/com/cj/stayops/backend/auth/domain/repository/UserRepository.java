package com.cj.stayops.backend.auth.domain.repository;

import java.util.Optional;

import com.cj.stayops.backend.auth.domain.model.Email;
import com.cj.stayops.backend.auth.domain.model.User;
import com.cj.stayops.backend.auth.domain.model.UserId;

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
}
