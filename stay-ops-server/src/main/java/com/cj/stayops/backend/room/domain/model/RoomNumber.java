package com.cj.stayops.backend.room.domain.model;

import java.util.regex.Pattern;

import com.cj.stayops.backend.room.domain.exception.InvalidRoomFieldException;

/**
 * 방 호수 Value Object. 예: "201", "B-3", "101A".
 * <p>
 * 영문/숫자/하이픈만 허용, 1~10자.
 */
public final class RoomNumber {

	private static final Pattern PATTERN = Pattern.compile("^[A-Za-z0-9-]{1,10}$");

	private final String value;

	private RoomNumber(String value) {
		this.value = value;
	}

	public static RoomNumber of(String raw) {
		if (raw == null || raw.isBlank()) {
			throw new InvalidRoomFieldException("roomNumber", "방 호수는 비어 있을 수 없습니다.");
		}
		String normalized = raw.trim().toUpperCase();
		if (!PATTERN.matcher(normalized).matches()) {
			throw new InvalidRoomFieldException("roomNumber",
				"방 호수는 영문/숫자/하이픈만 가능하며 1~10자여야 합니다: " + raw);
		}
		return new RoomNumber(normalized);
	}

	public String value() {
		return value;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof RoomNumber other)) return false;
		return value.equals(other.value);
	}

	@Override
	public int hashCode() {
		return value.hashCode();
	}

	@Override
	public String toString() {
		return value;
	}
}
