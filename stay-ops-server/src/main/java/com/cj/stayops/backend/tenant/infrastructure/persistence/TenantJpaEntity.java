package com.cj.stayops.backend.tenant.infrastructure.persistence;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * Tenant Aggregate 의 JPA 영속화 전용 엔티티.
 * <p>
 * - phoneDigits: 하이픈 없이 숫자만 저장
 * - roomId: Room 과의 연결 (FK 로 만들지 않음 — DDD 애그리거트 경계 존중. 참조 무결성은 애플리케이션 레벨에서 관리)
 * - deletedAt: soft delete. null 이면 활성.
 */
@Entity
@Table(name = "tenants", indexes = {
	@Index(name = "idx_tenants_status", columnList = "status"),
	@Index(name = "idx_tenants_room_id", columnList = "room_id")
})
public class TenantJpaEntity {

	@Id
	@Column(name = "id", columnDefinition = "uuid", nullable = false, updatable = false)
	private UUID id;

	@Column(name = "name", nullable = false, length = 50)
	private String name;

	@Column(name = "phone_digits", nullable = false, length = 11)
	private String phoneDigits;

	@Column(name = "room_id", columnDefinition = "uuid")
	private UUID roomId;

	@Column(name = "status", nullable = false, length = 20)
	private String status;

	@Column(name = "move_in_date")
	private LocalDate moveInDate;

	@Column(name = "move_out_date")
	private LocalDate moveOutDate;

	@Column(name = "memo", length = 500)
	private String memo;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Column(name = "deleted_at")
	private Instant deletedAt;

	protected TenantJpaEntity() {
	}

	public TenantJpaEntity(UUID id, String name, String phoneDigits, UUID roomId, String status,
						   LocalDate moveInDate, LocalDate moveOutDate, String memo,
						   Instant createdAt, Instant updatedAt, Instant deletedAt) {
		this.id = id;
		this.name = name;
		this.phoneDigits = phoneDigits;
		this.roomId = roomId;
		this.status = status;
		this.moveInDate = moveInDate;
		this.moveOutDate = moveOutDate;
		this.memo = memo;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.deletedAt = deletedAt;
	}

	public UUID getId() { return id; }
	public String getName() { return name; }
	public String getPhoneDigits() { return phoneDigits; }
	public UUID getRoomId() { return roomId; }
	public String getStatus() { return status; }
	public LocalDate getMoveInDate() { return moveInDate; }
	public LocalDate getMoveOutDate() { return moveOutDate; }
	public String getMemo() { return memo; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
	public Instant getDeletedAt() { return deletedAt; }
}
