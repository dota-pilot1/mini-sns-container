package com.cj.stayops.backend.room.infrastructure.persistence;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * RoomImage 영속화 전용 엔티티.
 * <p>
 * 대표 이미지(room당 1개) 는 서비스 레이어 트랜잭션으로 강제. Postgres 에서 부분 unique 인덱스
 * ({@code WHERE is_primary = true}) 를 별도 DDL 로 걸어도 좋다.
 */
@Entity
@Table(
	name = "room_images",
	indexes = {
		@Index(name = "idx_room_images_room_id", columnList = "room_id"),
		@Index(name = "uk_room_images_s3_key", columnList = "s3_key", unique = true)
	}
)
public class RoomImageJpaEntity {

	@Id
	@Column(name = "id", columnDefinition = "uuid", nullable = false, updatable = false)
	private UUID id;

	@Column(name = "room_id", columnDefinition = "uuid", nullable = false)
	private UUID roomId;

	@Column(name = "s3_key", nullable = false, length = 512, unique = true)
	private String s3Key;

	@Column(name = "content_type", nullable = false, length = 100)
	private String contentType;

	@Column(name = "size_bytes", nullable = false)
	private long sizeBytes;

	@Column(name = "sort_order", nullable = false)
	private int sortOrder;

	@Column(name = "is_primary", nullable = false)
	private boolean primary;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	protected RoomImageJpaEntity() {
	}

	public RoomImageJpaEntity(UUID id, UUID roomId, String s3Key, String contentType,
							  long sizeBytes, int sortOrder, boolean primary, Instant createdAt) {
		this.id = id;
		this.roomId = roomId;
		this.s3Key = s3Key;
		this.contentType = contentType;
		this.sizeBytes = sizeBytes;
		this.sortOrder = sortOrder;
		this.primary = primary;
		this.createdAt = createdAt;
	}

	public UUID getId() { return id; }
	public UUID getRoomId() { return roomId; }
	public String getS3Key() { return s3Key; }
	public String getContentType() { return contentType; }
	public long getSizeBytes() { return sizeBytes; }
	public int getSortOrder() { return sortOrder; }
	public boolean isPrimary() { return primary; }
	public Instant getCreatedAt() { return createdAt; }

	void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
	void setPrimary(boolean primary) { this.primary = primary; }
}
