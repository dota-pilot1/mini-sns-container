package com.cj.stayops.backend.contract.domain.model;

import java.util.Objects;
import java.util.UUID;

public final class ContractId {

	private final UUID value;

	private ContractId(UUID value) {
		this.value = Objects.requireNonNull(value, "ContractId value must not be null");
	}

	public static ContractId generate() {
		return new ContractId(UUID.randomUUID());
	}

	public static ContractId of(UUID value) {
		return new ContractId(value);
	}

	public static ContractId of(String value) {
		return new ContractId(UUID.fromString(value));
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
		if (!(o instanceof ContractId other)) return false;
		return value.equals(other.value);
	}

	@Override
	public int hashCode() {
		return value.hashCode();
	}
}
