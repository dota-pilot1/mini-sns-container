package com.cj.stayops.backend.room.domain.model;

import java.util.Objects;
import java.util.UUID;

/**
 * Room Aggregate의 식별자 (Value Object).
 */
public final class RoomId {

	private final UUID value;

	private RoomId(UUID value) {
		this.value = Objects.requireNonNull(value, "RoomId value must not be null");
	}

	public static RoomId generate() {
		return new RoomId(UUID.randomUUID());
	}

	public static RoomId of(UUID value) {
		return new RoomId(value);
	}

	public static RoomId of(String value) {
		return new RoomId(UUID.fromString(value));
	}

	public UUID value() {
		return value;
	}

	public String asString() {
		return value.toString();
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof RoomId other)) return false;
		return value.equals(other.value);
	}

	@Override
	public int hashCode() {
		return value.hashCode();
	}

	@Override
	public String toString() {
		return "RoomId(" + value + ")";
	}
}
