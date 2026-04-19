package com.cj.stayops.backend.payment.domain.model;

import java.util.Objects;
import java.util.UUID;

public final class PaymentId {

	private final UUID value;

	private PaymentId(UUID value) {
		this.value = Objects.requireNonNull(value, "PaymentId value must not be null");
	}

	public static PaymentId generate() {
		return new PaymentId(UUID.randomUUID());
	}

	public static PaymentId of(UUID value) {
		return new PaymentId(value);
	}

	public static PaymentId of(String value) {
		return new PaymentId(UUID.fromString(value));
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
		if (!(o instanceof PaymentId other)) return false;
		return value.equals(other.value);
	}

	@Override
	public int hashCode() {
		return value.hashCode();
	}
}
