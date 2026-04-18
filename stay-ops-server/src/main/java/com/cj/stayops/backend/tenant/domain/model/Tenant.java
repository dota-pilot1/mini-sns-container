package com.cj.stayops.backend.tenant.domain.model;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import com.cj.stayops.backend.tenant.domain.exception.InvalidTenantFieldException;

/**
 * Tenant (입주자) Aggregate Root.
 * <p>
 * 사람 정보(이름·연락처·메모)만 책임진다. 방 배정·입실·퇴실 정보는 별도 {@code Contract}
 * aggregate 로 분리되어, 한 Tenant 가 여러 Contract 를 가질 수 있다 (재입주·방이동 이력 보존).
 */
public class Tenant {

	private static final int NAME_MIN_LENGTH = 1;
	private static final int NAME_MAX_LENGTH = 50;
	private static final int MEMO_MAX_LENGTH = 500;

	private final TenantId id;
	private final UUID userId;        // nullable — 시더/레거시 데이터 호환
	private final String name;
	private final PhoneNumber phoneNumber;
	private final String memo;
	private final Instant createdAt;
	private final Instant updatedAt;

	private Tenant(TenantId id, UUID userId, String name, PhoneNumber phoneNumber, String memo,
				   Instant createdAt, Instant updatedAt) {
		this.id = Objects.requireNonNull(id, "id");
		this.userId = userId;
		this.name = Objects.requireNonNull(name, "name");
		this.phoneNumber = Objects.requireNonNull(phoneNumber, "phoneNumber");
		this.memo = memo;
		this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
		this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt");
	}

	public static Tenant register(TenantId id, UUID userId, String name, PhoneNumber phoneNumber,
								  String memo, Instant now) {
		String normalizedName = validateName(name);
		validateMemo(memo);
		return new Tenant(id, userId, normalizedName, phoneNumber, normalizeMemo(memo), now, now);
	}

	public static Tenant reconstitute(TenantId id, UUID userId, String name, PhoneNumber phoneNumber,
									  String memo, Instant createdAt, Instant updatedAt) {
		return new Tenant(id, userId, name, phoneNumber, memo, createdAt, updatedAt);
	}

	/** 기본 정보 수정 (PATCH 시맨틱 — null 필드는 유지). */
	public Tenant update(String newName, PhoneNumber newPhone, String newMemo, Instant now) {
		String nameToUse = newName == null ? this.name : validateName(newName);
		PhoneNumber phoneToUse = newPhone == null ? this.phoneNumber : newPhone;
		String memoToUse;
		if (newMemo == null) {
			memoToUse = this.memo;
		} else {
			validateMemo(newMemo);
			memoToUse = normalizeMemo(newMemo);
		}
		return new Tenant(id, userId, nameToUse, phoneToUse, memoToUse, createdAt, now);
	}

	// ---------- 검증 ----------

	private static String validateName(String name) {
		if (name == null) {
			throw new InvalidTenantFieldException("name", "이름은 필수입니다.");
		}
		String trimmed = name.trim();
		if (trimmed.length() < NAME_MIN_LENGTH || trimmed.length() > NAME_MAX_LENGTH) {
			throw new InvalidTenantFieldException("name",
				"이름은 " + NAME_MIN_LENGTH + "~" + NAME_MAX_LENGTH + "자여야 합니다.");
		}
		return trimmed;
	}

	private static void validateMemo(String memo) {
		if (memo != null && memo.length() > MEMO_MAX_LENGTH) {
			throw new InvalidTenantFieldException("memo",
				"메모는 " + MEMO_MAX_LENGTH + "자 이하여야 합니다.");
		}
	}

	private static String normalizeMemo(String memo) {
		if (memo == null) return null;
		String trimmed = memo.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	// ---------- accessors ----------

	public TenantId id() { return id; }
	public UUID userId() { return userId; }
	public String name() { return name; }
	public PhoneNumber phoneNumber() { return phoneNumber; }
	public String memo() { return memo; }
	public Instant createdAt() { return createdAt; }
	public Instant updatedAt() { return updatedAt; }

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof Tenant other)) return false;
		return id.equals(other.id);
	}

	@Override
	public int hashCode() {
		return id.hashCode();
	}
}
