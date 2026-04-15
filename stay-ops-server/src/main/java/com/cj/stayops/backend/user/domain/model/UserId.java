package com.cj.stayops.backend.user.domain.model;

import java.util.Objects;
import java.util.UUID;

/**
 * User Aggregate의 식별자 (Value Object).
 * <p>
 * UUID 기반으로 도메인 계층에서 식별자를 직접 생성할 수 있다
 * (DB의 auto-increment에 의존하지 않음 → 도메인 순수성 유지).
 */
public final class UserId {

	private final UUID value;

	private UserId(UUID value) {
		this.value = Objects.requireNonNull(value, "UserId value must not be null");
	}

	public static UserId generate() {
		return new UserId(UUID.randomUUID());
	}

	public static UserId of(UUID value) {
		return new UserId(value);
	}

	public static UserId of(String value) {
		return new UserId(UUID.fromString(value));
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
		if (!(o instanceof UserId other)) return false;
		return value.equals(other.value);
	}

	@Override
	public int hashCode() {
		return value.hashCode();
	}

	@Override
	public String toString() {
		return "UserId(" + value + ")";
	}
}
