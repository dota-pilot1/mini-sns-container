package com.cj.stayops.backend.contract.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

import com.cj.stayops.backend.contract.domain.exception.InvalidContractFieldException;

/**
 * Contract (계약) Aggregate Root.
 * <p>
 * Tenant 가 특정 Room 에 입주할 때 체결되는 한 번의 계약. 월세/보증금은 계약 시점 스냅샷이며
 * Room 의 현재 값이 바뀌더라도 이 계약은 기존 금액을 유지한다.
 * <p>
 * 재계약/연장은 이 계약을 수정하는 것이 아니라 새 Contract 를 {@code previousContractId} 로
 * 체인 연결해 생성한다. 상태 enum 은 두지 않는다 — 계약의 "유효함" 은 날짜 + 소프트 삭제에서
 * 파생된다. 중도 취소는 endDate 를 취소일로 단축할 뿐 별도 status flip 을 쓰지 않는다.
 * <p>
 * 파생 상태 (저장되지 않음):
 * <ul>
 *   <li>{@code today < startDate} → 예정</li>
 *   <li>{@code startDate ≤ today ≤ endDate} → 거주중 (effective)</li>
 *   <li>{@code today > endDate} → 지나간 계약 (자연 만료든 중도 취소든)</li>
 *   <li>{@code deletedAt != null} → 소프트 삭제, 모든 조회에서 제외</li>
 * </ul>
 * <p>
 * 불변식:
 * <ul>
 *   <li>startDate ≤ endDate</li>
 *   <li>monthlyRent ≥ 0, deposit ≥ 0</li>
 *   <li>endDate 는 단축만 가능 (truncateEndDate), 늘릴 수 없음</li>
 * </ul>
 */
public class Contract {

	private final ContractId id;
	private final UUID tenantId;
	private final UUID roomId;
	private final LocalDate startDate;
	private final LocalDate endDate;
	private final long monthlyRent;   // 원
	private final long deposit;       // 원
	private final ContractId previousContractId;   // 재계약 체인 — 원계약이면 null
	private final Instant deletedAt;               // 소프트 삭제 — null 이면 유효 레코드
	private final Instant createdAt;
	private final Instant updatedAt;

	private Contract(ContractId id, UUID tenantId, UUID roomId,
					 LocalDate startDate, LocalDate endDate,
					 long monthlyRent, long deposit,
					 ContractId previousContractId,
					 Instant deletedAt,
					 Instant createdAt, Instant updatedAt) {
		this.id = Objects.requireNonNull(id, "id");
		this.tenantId = Objects.requireNonNull(tenantId, "tenantId");
		this.roomId = Objects.requireNonNull(roomId, "roomId");
		this.startDate = Objects.requireNonNull(startDate, "startDate");
		this.endDate = Objects.requireNonNull(endDate, "endDate");
		this.monthlyRent = monthlyRent;
		this.deposit = deposit;
		this.previousContractId = previousContractId;
		this.deletedAt = deletedAt;
		this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
		this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt");
	}

	public static Contract create(ContractId id, UUID tenantId, UUID roomId,
								  LocalDate startDate, LocalDate endDate,
								  long monthlyRent, long deposit,
								  Instant now) {
		return create(id, tenantId, roomId, startDate, endDate, monthlyRent, deposit, null, now);
	}

	/**
	 * 재계약/연장 — 이전 계약의 id 를 체인에 걸어 새 Contract 생성.
	 * {@code previousContractId} null 이면 원계약(신규 입주).
	 */
	public static Contract create(ContractId id, UUID tenantId, UUID roomId,
								  LocalDate startDate, LocalDate endDate,
								  long monthlyRent, long deposit,
								  ContractId previousContractId,
								  Instant now) {
		validateDates(startDate, endDate);
		validateAmount("monthlyRent", monthlyRent);
		validateAmount("deposit", deposit);
		return new Contract(
			id, tenantId, roomId, startDate, endDate,
			monthlyRent, deposit,
			previousContractId, null, now, now
		);
	}

	public static Contract reconstitute(ContractId id, UUID tenantId, UUID roomId,
										LocalDate startDate, LocalDate endDate,
										long monthlyRent, long deposit,
										ContractId previousContractId,
										Instant deletedAt,
										Instant createdAt, Instant updatedAt) {
		return new Contract(id, tenantId, roomId, startDate, endDate,
			monthlyRent, deposit, previousContractId, deletedAt, createdAt, updatedAt);
	}

	/**
	 * 중도 취소 — endDate 를 취소일로 단축.
	 * <p>원래 endDate 보다 뒤의 날짜는 거부 (계약 기간은 늘릴 수 없음).
	 * startDate 보다 앞의 날짜도 거부.
	 */
	public Contract truncateEndDate(LocalDate newEndDate, Instant now) {
		Objects.requireNonNull(newEndDate, "newEndDate");
		if (newEndDate.isBefore(startDate)) {
			throw new InvalidContractFieldException("newEndDate",
				"종료일은 시작일 이후여야 합니다.");
		}
		if (newEndDate.isAfter(endDate)) {
			throw new InvalidContractFieldException("newEndDate",
				"endDate 는 단축만 가능합니다. 연장은 새 계약을 추가하세요.");
		}
		return new Contract(id, tenantId, roomId, startDate, newEndDate,
			monthlyRent, deposit, previousContractId, deletedAt, createdAt, now);
	}

	/** 소프트 삭제 — 이미 삭제된 경우 no-op. */
	public Contract softDelete(Instant now) {
		if (deletedAt != null) return this;
		return new Contract(id, tenantId, roomId, startDate, endDate,
			monthlyRent, deposit,
			previousContractId, now, createdAt, now);
	}

	// ---------- 검증 ----------

	private static void validateDates(LocalDate start, LocalDate end) {
		Objects.requireNonNull(start, "startDate");
		Objects.requireNonNull(end, "endDate");
		if (end.isBefore(start)) {
			throw new InvalidContractFieldException("endDate",
				"종료일은 시작일 이후여야 합니다.");
		}
	}

	private static void validateAmount(String field, long value) {
		if (value < 0) {
			throw new InvalidContractFieldException(field, field + "는 0 이상이어야 합니다.");
		}
	}

	// ---------- accessors ----------

	public ContractId id() { return id; }
	public UUID tenantId() { return tenantId; }
	public UUID roomId() { return roomId; }
	public LocalDate startDate() { return startDate; }
	public LocalDate endDate() { return endDate; }
	public long monthlyRent() { return monthlyRent; }
	public long deposit() { return deposit; }
	public ContractId previousContractId() { return previousContractId; }
	public Instant deletedAt() { return deletedAt; }
	public Instant createdAt() { return createdAt; }
	public Instant updatedAt() { return updatedAt; }

	public boolean isDeleted() { return deletedAt != null; }

	/** 주어진 날짜에 계약이 유효한지 — deletedAt IS NULL AND startDate ≤ date ≤ endDate. */
	public boolean isEffectiveOn(LocalDate date) {
		if (deletedAt != null) return false;
		Objects.requireNonNull(date, "date");
		return !date.isBefore(startDate) && !date.isAfter(endDate);
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof Contract other)) return false;
		return id.equals(other.id);
	}

	@Override
	public int hashCode() {
		return id.hashCode();
	}
}
