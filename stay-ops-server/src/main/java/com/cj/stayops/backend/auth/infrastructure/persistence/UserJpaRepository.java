package com.cj.stayops.backend.auth.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA Repository (기술 세부사항).
 * <p>
 * 도메인 계층은 이 인터페이스를 모른다 —
 * {@link com.cj.stayops.backend.auth.domain.repository.UserRepository}만 의존.
 */
public interface UserJpaRepository extends JpaRepository<UserJpaEntity, UUID> {

	Optional<UserJpaEntity> findByEmail(String email);

	boolean existsByEmail(String email);
}
