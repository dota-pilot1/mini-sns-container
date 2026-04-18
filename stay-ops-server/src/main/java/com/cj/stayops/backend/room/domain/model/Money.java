package com.cj.stayops.backend.room.domain.model;

import com.cj.stayops.backend.room.domain.exception.InvalidRoomFieldException;

/**
 * 금액 Value Object (KRW, 원 단위).
 * <p>
 * 음수 불가. 나중에 다른 도메인에서도 쓰면 common 패키지로 승격 고려.
 */
public final class Money {

	private final long amount;

	private Money(long amount) {
		this.amount = amount;
	}

	public static Money of(long amount) {
		return of(amount, "amount");
	}

	public static Money of(long amount, String fieldName) {
		if (amount < 0) {
			throw new InvalidRoomFieldException(fieldName, "금액은 0 이상이어야 합니다: " + amount);
		}
		return new Money(amount);
	}

	public static Money zero() {
		return new Money(0L);
	}

	public long amount() {
		return amount;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof Money other)) return false;
		return amount == other.amount;
	}

	@Override
	public int hashCode() {
		return Long.hashCode(amount);
	}

	@Override
	public String toString() {
		return amount + " KRW";
	}
}
