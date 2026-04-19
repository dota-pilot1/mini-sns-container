package com.cj.stayops.backend.room.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Objects;
import java.util.Set;

import com.cj.stayops.backend.room.domain.exception.InvalidRoomFieldException;

/**
 * Room Aggregate Root.
 * <p>
 * 불변식:
 * <ul>
 *   <li>roomNumber 는 시스템 내에서 유일 (Application Layer 에서 보장)</li>
 *   <li>monthlyRent/deposit ≥ 0 (Money VO 가 보장)</li>
 *   <li>sizePyeong &gt; 0</li>
 *   <li>floor 는 -5 ~ 50 범위 (지하~고층)</li>
 *   <li>삭제된 방(deletedAt != null)은 상태 변경/수정 불가</li>
 * </ul>
 * <p>
 * 수정 연산은 {@code with*} 메서드로 새 인스턴스를 반환한다 (immutable pattern).
 * <p>
 * <b>메모:</b> 고시원 현장이 전원 1인실이라 {@code roomType} 개념은 제거됨. 평수/옵션으로 차이를 표현한다.
 */
public class Room {

	private static final int MIN_FLOOR = -5;
	private static final int MAX_FLOOR = 50;
	private static final int MEMO_MAX_LENGTH = 500;

	private final RoomId id;
	private final RoomNumber roomNumber;
	private final int floor;
	private final BigDecimal sizePyeong;
	private final Money monthlyRent;
	private final Money deposit;
	private final RoomStatus status;
	private final Set<RoomOption> options;
	private final String memo;
	private final Instant createdAt;
	private final Instant updatedAt;
	private final Instant deletedAt; // nullable

	private Room(RoomId id, RoomNumber roomNumber, int floor, BigDecimal sizePyeong,
				 Money monthlyRent, Money deposit, RoomStatus status,
				 Set<RoomOption> options, String memo,
				 Instant createdAt, Instant updatedAt, Instant deletedAt) {
		this.id = Objects.requireNonNull(id, "id");
		this.roomNumber = Objects.requireNonNull(roomNumber, "roomNumber");
		this.floor = floor;
		this.sizePyeong = Objects.requireNonNull(sizePyeong, "sizePyeong");
		this.monthlyRent = Objects.requireNonNull(monthlyRent, "monthlyRent");
		this.deposit = Objects.requireNonNull(deposit, "deposit");
		this.status = Objects.requireNonNull(status, "status");
		this.options = options == null ? EnumSet.noneOf(RoomOption.class) : EnumSet.copyOf(options);
		this.memo = memo;
		this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
		this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt");
		this.deletedAt = deletedAt;
	}

	/**
	 * 신규 방 등록용 정적 팩토리. 상태는 VACANT 로 시작.
	 */
	public static Room register(RoomId id, RoomNumber roomNumber, int floor, BigDecimal sizePyeong,
								Money monthlyRent, Money deposit,
								Set<RoomOption> options, String memo, Instant now) {
		validateFloor(floor);
		validateSize(sizePyeong);
		validateMemo(memo);
		return new Room(
			id, roomNumber, floor, sizePyeong,
			monthlyRent, deposit, RoomStatus.VACANT,
			options, normalizeMemo(memo), now, now, null
		);
	}

	/**
	 * Infrastructure Layer 에서 영속 데이터를 도메인으로 복원할 때 사용.
	 */
	public static Room reconstitute(RoomId id, RoomNumber roomNumber, int floor, BigDecimal sizePyeong,
									Money monthlyRent, Money deposit,
									RoomStatus status, Set<RoomOption> options, String memo,
									Instant createdAt, Instant updatedAt, Instant deletedAt) {
		return new Room(id, roomNumber, floor, sizePyeong,
			monthlyRent, deposit, status, options, memo,
			createdAt, updatedAt, deletedAt);
	}

	// ---------- 상태 전이 / 수정 ----------

	public Room changeStatus(RoomStatus newStatus, Instant now) {
		ensureNotDeleted();
		Objects.requireNonNull(newStatus, "newStatus");
		if (this.status == newStatus) {
			return this;
		}
		return new Room(id, roomNumber, floor, sizePyeong,
			monthlyRent, deposit, newStatus, options, memo,
			createdAt, now, deletedAt);
	}

	/**
	 * 여러 필드를 한 번에 수정. 호수 포함. null 인 필드는 기존 값 유지.
	 */
	public Room update(RoomNumber newRoomNumber, Integer newFloor, BigDecimal newSize,
					   Money newRent, Money newDeposit,
					   Set<RoomOption> newOptions, String newMemo, Instant now) {
		ensureNotDeleted();
		int floorToUse = newFloor == null ? this.floor : newFloor;
		BigDecimal sizeToUse = newSize == null ? this.sizePyeong : newSize;
		String memoToUse = newMemo == null ? this.memo : normalizeMemo(newMemo);

		validateFloor(floorToUse);
		validateSize(sizeToUse);
		if (newMemo != null) {
			validateMemo(newMemo);
		}

		return new Room(
			id,
			newRoomNumber == null ? this.roomNumber : newRoomNumber,
			floorToUse,
			sizeToUse,
			newRent == null ? this.monthlyRent : newRent,
			newDeposit == null ? this.deposit : newDeposit,
			this.status,
			newOptions == null ? this.options : newOptions,
			memoToUse,
			createdAt,
			now,
			deletedAt
		);
	}

	public Room markDeleted(Instant now) {
		if (isDeleted()) {
			return this;
		}
		return new Room(id, roomNumber, floor, sizePyeong,
			monthlyRent, deposit, status, options, memo,
			createdAt, now, now);
	}

	public boolean isDeleted() {
		return deletedAt != null;
	}

	private void ensureNotDeleted() {
		if (isDeleted()) {
			throw new InvalidRoomFieldException("status", "삭제된 방은 수정할 수 없습니다.");
		}
	}

	// ---------- 검증 ----------

	private static void validateFloor(int floor) {
		if (floor < MIN_FLOOR || floor > MAX_FLOOR) {
			throw new InvalidRoomFieldException("floor",
				"층은 " + MIN_FLOOR + " ~ " + MAX_FLOOR + " 범위여야 합니다: " + floor);
		}
	}

	private static void validateSize(BigDecimal sizePyeong) {
		if (sizePyeong == null || sizePyeong.signum() <= 0) {
			throw new InvalidRoomFieldException("sizePyeong", "평수는 0보다 커야 합니다: " + sizePyeong);
		}
	}

	private static void validateMemo(String memo) {
		if (memo != null && memo.length() > MEMO_MAX_LENGTH) {
			throw new InvalidRoomFieldException("memo",
				"메모는 " + MEMO_MAX_LENGTH + "자 이하여야 합니다.");
		}
	}

	private static String normalizeMemo(String memo) {
		if (memo == null) return null;
		String trimmed = memo.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	// ---------- accessors ----------

	public RoomId id() { return id; }
	public RoomNumber roomNumber() { return roomNumber; }
	public int floor() { return floor; }
	public BigDecimal sizePyeong() { return sizePyeong; }
	public Money monthlyRent() { return monthlyRent; }
	public Money deposit() { return deposit; }
	public RoomStatus status() { return status; }
	public Set<RoomOption> options() { return Collections.unmodifiableSet(options); }
	public String memo() { return memo; }
	public Instant createdAt() { return createdAt; }
	public Instant updatedAt() { return updatedAt; }
	public Instant deletedAt() { return deletedAt; }

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof Room other)) return false;
		return id.equals(other.id);
	}

	@Override
	public int hashCode() {
		return id.hashCode();
	}
}
