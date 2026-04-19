package com.cj.stayops.backend.room.domain.model;

import java.util.Objects;
import java.util.UUID;

/** Room 에 속한 이미지 식별자 (Value Object). */
public final class RoomImageId {

	private final UUID value;

	private RoomImageId(UUID value) {
		this.value = Objects.requireNonNull(value, "RoomImageId value must not be null");
	}

	public static RoomImageId generate() {
		return new RoomImageId(UUID.randomUUID());
	}

	public static RoomImageId of(UUID value) {
		return new RoomImageId(value);
	}

	public static RoomImageId of(String value) {
		return new RoomImageId(UUID.fromString(value));
	}

	public UUID value() { return value; }

	public String asString() { return value.toString(); }

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof RoomImageId other)) return false;
		return value.equals(other.value);
	}

	@Override
	public int hashCode() { return value.hashCode(); }
}
