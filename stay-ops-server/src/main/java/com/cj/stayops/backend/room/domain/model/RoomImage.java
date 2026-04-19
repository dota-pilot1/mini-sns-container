package com.cj.stayops.backend.room.domain.model;

import java.time.Instant;
import java.util.Objects;

/**
 * 방에 속한 이미지 (Entity). Room Aggregate 하위지만, 대량 조회 편의를 위해
 * 별도 테이블로 영속화되며 상태 변경도 전용 UseCase 에서 처리한다.
 * <p>
 * 불변식:
 * <ul>
 *   <li>roomId, s3Key, contentType 는 null 불가</li>
 *   <li>sizeBytes 는 0 이상</li>
 *   <li>대표 이미지(isPrimary=true)는 같은 Room 에 최대 1개 (Application Layer 에서 보장)</li>
 * </ul>
 */
public class RoomImage {

	private final RoomImageId id;
	private final RoomId roomId;
	private final String s3Key;
	private final String contentType;
	private final long sizeBytes;
	private final int sortOrder;
	private final boolean primary;
	private final Instant createdAt;

	private RoomImage(RoomImageId id, RoomId roomId, String s3Key, String contentType,
					  long sizeBytes, int sortOrder, boolean primary, Instant createdAt) {
		this.id = Objects.requireNonNull(id, "id");
		this.roomId = Objects.requireNonNull(roomId, "roomId");
		this.s3Key = Objects.requireNonNull(s3Key, "s3Key");
		this.contentType = Objects.requireNonNull(contentType, "contentType");
		if (sizeBytes < 0) throw new IllegalArgumentException("sizeBytes must be >= 0");
		this.sizeBytes = sizeBytes;
		this.sortOrder = sortOrder;
		this.primary = primary;
		this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
	}

	public static RoomImage register(RoomImageId id, RoomId roomId, String s3Key, String contentType,
									 long sizeBytes, int sortOrder, boolean primary, Instant now) {
		return new RoomImage(id, roomId, s3Key, contentType, sizeBytes, sortOrder, primary, now);
	}

	public static RoomImage reconstitute(RoomImageId id, RoomId roomId, String s3Key, String contentType,
										 long sizeBytes, int sortOrder, boolean primary, Instant createdAt) {
		return new RoomImage(id, roomId, s3Key, contentType, sizeBytes, sortOrder, primary, createdAt);
	}

	public RoomImage withPrimary(boolean primary) {
		if (this.primary == primary) return this;
		return new RoomImage(id, roomId, s3Key, contentType, sizeBytes, sortOrder, primary, createdAt);
	}

	public RoomImage withSortOrder(int sortOrder) {
		if (this.sortOrder == sortOrder) return this;
		return new RoomImage(id, roomId, s3Key, contentType, sizeBytes, sortOrder, primary, createdAt);
	}

	public RoomImageId id() { return id; }
	public RoomId roomId() { return roomId; }
	public String s3Key() { return s3Key; }
	public String contentType() { return contentType; }
	public long sizeBytes() { return sizeBytes; }
	public int sortOrder() { return sortOrder; }
	public boolean isPrimary() { return primary; }
	public Instant createdAt() { return createdAt; }

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof RoomImage other)) return false;
		return id.equals(other.id);
	}

	@Override
	public int hashCode() { return id.hashCode(); }
}
