package com.cj.stayops.backend.tenant.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

import com.cj.stayops.backend.tenant.domain.exception.InvalidTenantFieldException;

/**
 * Tenant (입주자) Aggregate Root.
 * <p>
 * 불변식:
 * <ul>
 *   <li>name 은 1~50자</li>
 *   <li>phoneNumber 는 한국 형식 (PhoneNumber VO 가 보장)</li>
 *   <li>moveOutDate 는 moveInDate 이후여야 함 (둘 다 있을 때)</li>
 *   <li>memo 는 500자 이하</li>
 *   <li>삭제된 입주자(deletedAt != null)는 상태 변경/수정 불가</li>
 * </ul>
 * <p>
 * 수정 연산은 {@code with*}/{@code update}/{@code changeStatus} 메서드로 새 인스턴스를 반환한다 (immutable pattern).
 * <p>
 * <b>설계 메모 — 상태 전이:</b> 입주/퇴실은 테이블 이동이 아니라 {@code status} 컬럼 변경으로 표현한다.
 * MOVED_OUT 된 레코드도 계속 보존되어 이력 조회가 가능하다.
 */
public class Tenant {

	private static final int NAME_MIN_LENGTH = 1;
	private static final int NAME_MAX_LENGTH = 50;
	private static final int MEMO_MAX_LENGTH = 500;

	private final TenantId id;
	private final String name;
	private final PhoneNumber phoneNumber;
	private final UUID roomId;          // nullable — 아직 방 미배정 가능
	private final TenantStatus status;
	private final LocalDate moveInDate;  // nullable
	private final LocalDate moveOutDate; // nullable
	private final String memo;           // nullable
	private final Instant createdAt;
	private final Instant updatedAt;
	private final Instant deletedAt;     // nullable

	private Tenant(TenantId id, String name, PhoneNumber phoneNumber, UUID roomId,
				   TenantStatus status, LocalDate moveInDate, LocalDate moveOutDate, String memo,
				   Instant createdAt, Instant updatedAt, Instant deletedAt) {
		this.id = Objects.requireNonNull(id, "id");
		this.name = Objects.requireNonNull(name, "name");
		this.phoneNumber = Objects.requireNonNull(phoneNumber, "phoneNumber");
		this.roomId = roomId;
		this.status = Objects.requireNonNull(status, "status");
		this.moveInDate = moveInDate;
		this.moveOutDate = moveOutDate;
		this.memo = memo;
		this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
		this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt");
		this.deletedAt = deletedAt;
	}

	/**
	 * 신규 입주자 등록용 정적 팩토리. 상태는 RESERVED 로 시작 (방 배정은 선택).
	 */
	public static Tenant register(TenantId id, String name, PhoneNumber phoneNumber,
								  UUID roomId, LocalDate moveInDate, String memo, Instant now) {
		String normalizedName = validateName(name);
		validateMemo(memo);
		validateDateOrder(moveInDate, null);
		return new Tenant(
			id, normalizedName, phoneNumber, roomId,
			TenantStatus.RESERVED, moveInDate, null, normalizeMemo(memo),
			now, now, null
		);
	}

	/**
	 * Infrastructure Layer 에서 영속 데이터를 도메인으로 복원할 때 사용.
	 */
	public static Tenant reconstitute(TenantId id, String name, PhoneNumber phoneNumber,
									  UUID roomId, TenantStatus status,
									  LocalDate moveInDate, LocalDate moveOutDate, String memo,
									  Instant createdAt, Instant updatedAt, Instant deletedAt) {
		return new Tenant(id, name, phoneNumber, roomId, status,
			moveInDate, moveOutDate, memo, createdAt, updatedAt, deletedAt);
	}

	// ---------- 상태 전이 / 수정 ----------

	public Tenant changeStatus(TenantStatus newStatus, Instant now) {
		ensureNotDeleted();
		Objects.requireNonNull(newStatus, "newStatus");
		if (this.status == newStatus) {
			return this;
		}
		return new Tenant(id, name, phoneNumber, roomId, newStatus,
			moveInDate, moveOutDate, memo, createdAt, now, deletedAt);
	}

	/**
	 * 여러 필드를 한 번에 수정. null 인 필드는 기존 값 유지 (PATCH 시맨틱).
	 * roomId 는 null 의미가 모호해(해제 vs 변경없음) 별도 파라미터 {@code clearRoom} 으로 구분.
	 */
	public Tenant update(String newName, PhoneNumber newPhone,
						 UUID newRoomId, boolean clearRoom,
						 LocalDate newMoveIn, LocalDate newMoveOut,
						 String newMemo, Instant now) {
		ensureNotDeleted();

		String nameToUse = newName == null ? this.name : validateName(newName);
		PhoneNumber phoneToUse = newPhone == null ? this.phoneNumber : newPhone;
		UUID roomToUse = clearRoom ? null : (newRoomId == null ? this.roomId : newRoomId);
		LocalDate moveInToUse = newMoveIn == null ? this.moveInDate : newMoveIn;
		LocalDate moveOutToUse = newMoveOut == null ? this.moveOutDate : newMoveOut;
		String memoToUse = newMemo == null ? this.memo : normalizeMemo(newMemo);

		if (newMemo != null) validateMemo(newMemo);
		validateDateOrder(moveInToUse, moveOutToUse);

		return new Tenant(
			id, nameToUse, phoneToUse, roomToUse, this.status,
			moveInToUse, moveOutToUse, memoToUse,
			createdAt, now, deletedAt
		);
	}

	public Tenant markDeleted(Instant now) {
		if (isDeleted()) {
			return this;
		}
		return new Tenant(id, name, phoneNumber, roomId, status,
			moveInDate, moveOutDate, memo, createdAt, now, now);
	}

	public Tenant restore(Instant now) {
		if (!isDeleted()) {
			return this;
		}
		return new Tenant(id, name, phoneNumber, roomId, status,
			moveInDate, moveOutDate, memo, createdAt, now, null);
	}

	public boolean isDeleted() {
		return deletedAt != null;
	}

	private void ensureNotDeleted() {
		if (isDeleted()) {
			throw new InvalidTenantFieldException("status", "삭제된 입주자는 수정할 수 없습니다.");
		}
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

	private static void validateDateOrder(LocalDate moveIn, LocalDate moveOut) {
		if (moveIn != null && moveOut != null && moveOut.isBefore(moveIn)) {
			throw new InvalidTenantFieldException("moveOutDate",
				"퇴실일은 입실일 이후여야 합니다.");
		}
	}

	private static String normalizeMemo(String memo) {
		if (memo == null) return null;
		String trimmed = memo.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	// ---------- accessors ----------

	public TenantId id() { return id; }
	public String name() { return name; }
	public PhoneNumber phoneNumber() { return phoneNumber; }
	public UUID roomId() { return roomId; }
	public TenantStatus status() { return status; }
	public LocalDate moveInDate() { return moveInDate; }
	public LocalDate moveOutDate() { return moveOutDate; }
	public String memo() { return memo; }
	public Instant createdAt() { return createdAt; }
	public Instant updatedAt() { return updatedAt; }
	public Instant deletedAt() { return deletedAt; }

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
