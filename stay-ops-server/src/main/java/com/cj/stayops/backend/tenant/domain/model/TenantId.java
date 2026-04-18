package com.cj.stayops.backend.tenant.domain.model;

import java.util.Objects;
import java.util.UUID;

/**
 * Tenant Aggregate의 식별자 (Value Object).
 */
public final class TenantId {

	private final UUID value;

	private TenantId(UUID value) {
		this.value = Objects.requireNonNull(value, "TenantId value must not be null");
	}

	public static TenantId generate() {
		return new TenantId(UUID.randomUUID());
	}

	public static TenantId of(UUID value) {
		return new TenantId(value);
	}

	public static TenantId of(String value) {
		return new TenantId(UUID.fromString(value));
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
		if (!(o instanceof TenantId other)) return false;
		return value.equals(other.value);
	}

	@Override
	public int hashCode() {
		return value.hashCode();
	}

	@Override
	public String toString() {
		return "TenantId(" + value + ")";
	}
}
