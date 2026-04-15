package com.cj.stayops.backend.user.infrastructure.persistence;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * User Aggregate의 JPA 영속화 전용 엔티티.
 * <p>
 * 도메인 {@link com.cj.stayops.backend.user.domain.model.User}와 분리되어 있어
 * JPA 제약(기본 생성자, setter 등)이 도메인에 새어나가지 않는다.
 */
@Entity
@Table(name = "users", indexes = {
	@jakarta.persistence.Index(name = "uk_users_email", columnList = "email", unique = true)
})
public class UserJpaEntity {

	@Id
	@Column(name = "id", columnDefinition = "uuid", nullable = false, updatable = false)
	private UUID id;

	@Column(name = "email", nullable = false, length = 254, unique = true)
	private String email;

	@Column(name = "password_hash", nullable = false, length = 100)
	private String passwordHash;

	@Column(name = "name", nullable = false, length = 100)
	private String name;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	/** JPA 기본 생성자 (protected로 외부 생성 차단). */
	protected UserJpaEntity() {
	}

	public UserJpaEntity(UUID id, String email, String passwordHash, String name,
						 Instant createdAt, Instant updatedAt) {
		this.id = id;
		this.email = email;
		this.passwordHash = passwordHash;
		this.name = name;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	public UUID getId() { return id; }
	public String getEmail() { return email; }
	public String getPasswordHash() { return passwordHash; }
	public String getName() { return name; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
}
