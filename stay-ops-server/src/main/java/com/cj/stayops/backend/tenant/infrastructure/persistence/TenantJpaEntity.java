package com.cj.stayops.backend.tenant.infrastructure.persistence;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * Tenant Aggregate 의 JPA 영속화 전용 엔티티.
 * 사람 정보(이름·전화·메모 + 원본 User FK)만 저장. 계약은 {@code contracts} 테이블.
 */
@Entity
@Table(name = "tenants", indexes = {
	@Index(name = "idx_tenants_user_id", columnList = "user_id")
})
public class TenantJpaEntity {

	@Id
	@Column(name = "id", columnDefinition = "uuid", nullable = false, updatable = false)
	private UUID id;

	/** 원본 User 식별자 (회원가입 시 생성된 User 와 연결). 레거시 시드 데이터는 null. */
	@Column(name = "user_id", columnDefinition = "uuid")
	private UUID userId;

	@Column(name = "name", nullable = false, length = 50)
	private String name;

	@Column(name = "phone_digits", nullable = false, length = 11)
	private String phoneDigits;

	@Column(name = "memo", length = 500)
	private String memo;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected TenantJpaEntity() {
	}

	public TenantJpaEntity(UUID id, UUID userId, String name, String phoneDigits, String memo,
						   Instant createdAt, Instant updatedAt) {
		this.id = id;
		this.userId = userId;
		this.name = name;
		this.phoneDigits = phoneDigits;
		this.memo = memo;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	public UUID getId() { return id; }
	public UUID getUserId() { return userId; }
	public String getName() { return name; }
	public String getPhoneDigits() { return phoneDigits; }
	public String getMemo() { return memo; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
}
