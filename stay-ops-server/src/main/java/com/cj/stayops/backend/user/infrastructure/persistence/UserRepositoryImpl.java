package com.cj.stayops.backend.user.infrastructure.persistence;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.cj.stayops.backend.user.domain.model.Email;
import com.cj.stayops.backend.user.domain.model.User;
import com.cj.stayops.backend.user.domain.model.UserId;
import com.cj.stayops.backend.user.domain.repository.UserRepository;

/**
 * 도메인 {@link UserRepository} 계약의 JPA 기반 구현체.
 * <p>
 * 도메인 ↔ JPA 엔티티 매핑을 담당하여 양쪽 모델을 독립적으로 유지한다.
 */
@Repository
public class UserRepositoryImpl implements UserRepository {

	private final UserJpaRepository jpaRepository;

	public UserRepositoryImpl(UserJpaRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	public User save(User user) {
		UserJpaEntity entity = toEntity(user);
		UserJpaEntity saved = jpaRepository.save(entity);
		return toDomain(saved);
	}

	@Override
	public Optional<User> findById(UserId id) {
		return jpaRepository.findById(id.value()).map(this::toDomain);
	}

	@Override
	public Optional<User> findByEmail(Email email) {
		return jpaRepository.findByEmail(email.value()).map(this::toDomain);
	}

	@Override
	public boolean existsByEmail(Email email) {
		return jpaRepository.existsByEmail(email.value());
	}

	@Override
	public Page<User> findAll(Pageable pageable) {
		return jpaRepository.findAll(pageable).map(this::toDomain);
	}

	// ---------- mapping ----------

	private UserJpaEntity toEntity(User user) {
		return new UserJpaEntity(
			user.id().value(),
			user.email().value(),
			user.passwordHash(),
			user.name(),
			user.createdAt(),
			user.updatedAt()
		);
	}

	private User toDomain(UserJpaEntity entity) {
		return User.reconstitute(
			UserId.of(entity.getId()),
			Email.of(entity.getEmail()),
			entity.getPasswordHash(),
			entity.getName(),
			entity.getCreatedAt(),
			entity.getUpdatedAt()
		);
	}
}
