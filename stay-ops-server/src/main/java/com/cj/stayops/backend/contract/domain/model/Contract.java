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
 * 체인 연결해 생성한다. 즉 계약은 불변 레코드이며, 한번 만들어진 기간/금액은 도메인 메서드로
 * 바뀌지 않는다 (상태 전이 = TERMINATED / 소프트 삭제만 허용).
 * <p>
 * 불변식:
 * <ul>
 *   <li>startDate ≤ endDate</li>
 *   <li>monthlyRent ≥ 0, deposit ≥ 0</li>
 *   <li>ACTIVE 상태에서만 terminate 가능</li>
 *   <li>소프트 삭제된 계약은 모든 조회에서 제외된다 (리포지토리 레벨)</li>
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
	private final ContractStatus status;
	private final ContractId previousContractId;   // 재계약 체인 — 원계약이면 null
	private final Instant deletedAt;               // 소프트 삭제 — null 이면 활성
	private final Instant createdAt;
	private final Instant updatedAt;

	private Contract(ContractId id, UUID tenantId, UUID roomId,
					 LocalDate startDate, LocalDate endDate,
					 long monthlyRent, long deposit,
					 ContractStatus status,
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
		this.status = Objects.requireNonNull(status, "status");
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
			monthlyRent, deposit, ContractStatus.ACTIVE,
			previousContractId, null, now, now
		);
	}

	public static Contract reconstitute(ContractId id, UUID tenantId, UUID roomId,
										LocalDate startDate, LocalDate endDate,
										long monthlyRent, long deposit,
										ContractStatus status,
										ContractId previousContractId,
										Instant deletedAt,
										Instant createdAt, Instant updatedAt) {
		return new Contract(id, tenantId, roomId, startDate, endDate,
			monthlyRent, deposit, status, previousContractId, deletedAt, createdAt, updatedAt);
	}

	/** 중도 퇴실 — ACTIVE → TERMINATED, endDate 를 종료일로 업데이트. */
	public Contract terminate(LocalDate terminationDate, Instant now) {
		if (status != ContractStatus.ACTIVE) {
			throw new InvalidContractFieldException("status",
				"활성 계약만 종료할 수 있습니다. 현재 상태: " + status);
		}
		Objects.requireNonNull(terminationDate, "terminationDate");
		if (terminationDate.isBefore(startDate)) {
			throw new InvalidContractFieldException("terminationDate",
				"종료일은 시작일 이후여야 합니다.");
		}
		return new Contract(id, tenantId, roomId, startDate, terminationDate,
			monthlyRent, deposit, ContractStatus.TERMINATED,
			previousContractId, deletedAt, createdAt, now);
	}

	/** 소프트 삭제 — 이미 삭제된 경우 no-op. */
	public Contract softDelete(Instant now) {
		if (deletedAt != null) return this;
		return new Contract(id, tenantId, roomId, startDate, endDate,
			monthlyRent, deposit, status,
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
	public ContractStatus status() { return status; }
	public ContractId previousContractId() { return previousContractId; }
	public Instant deletedAt() { return deletedAt; }
	public Instant createdAt() { return createdAt; }
	public Instant updatedAt() { return updatedAt; }

	public boolean isActive() { return status == ContractStatus.ACTIVE && deletedAt == null; }
	public boolean isDeleted() { return deletedAt != null; }

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
