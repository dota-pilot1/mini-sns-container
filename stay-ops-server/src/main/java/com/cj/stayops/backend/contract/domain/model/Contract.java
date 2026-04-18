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
 * 불변식:
 * <ul>
 *   <li>startDate ≤ endDate</li>
 *   <li>monthlyRent ≥ 0, deposit ≥ 0</li>
 *   <li>ACTIVE 상태에서만 terminate 가능</li>
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
	private final Instant createdAt;
	private final Instant updatedAt;

	private Contract(ContractId id, UUID tenantId, UUID roomId,
					 LocalDate startDate, LocalDate endDate,
					 long monthlyRent, long deposit,
					 ContractStatus status,
					 Instant createdAt, Instant updatedAt) {
		this.id = Objects.requireNonNull(id, "id");
		this.tenantId = Objects.requireNonNull(tenantId, "tenantId");
		this.roomId = Objects.requireNonNull(roomId, "roomId");
		this.startDate = Objects.requireNonNull(startDate, "startDate");
		this.endDate = Objects.requireNonNull(endDate, "endDate");
		this.monthlyRent = monthlyRent;
		this.deposit = deposit;
		this.status = Objects.requireNonNull(status, "status");
		this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
		this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt");
	}

	public static Contract create(ContractId id, UUID tenantId, UUID roomId,
								  LocalDate startDate, LocalDate endDate,
								  long monthlyRent, long deposit,
								  Instant now) {
		validateDates(startDate, endDate);
		validateAmount("monthlyRent", monthlyRent);
		validateAmount("deposit", deposit);
		return new Contract(
			id, tenantId, roomId, startDate, endDate,
			monthlyRent, deposit, ContractStatus.ACTIVE, now, now
		);
	}

	public static Contract reconstitute(ContractId id, UUID tenantId, UUID roomId,
										LocalDate startDate, LocalDate endDate,
										long monthlyRent, long deposit,
										ContractStatus status,
										Instant createdAt, Instant updatedAt) {
		return new Contract(id, tenantId, roomId, startDate, endDate,
			monthlyRent, deposit, status, createdAt, updatedAt);
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
			monthlyRent, deposit, ContractStatus.TERMINATED, createdAt, now);
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
	public Instant createdAt() { return createdAt; }
	public Instant updatedAt() { return updatedAt; }

	public boolean isActive() { return status == ContractStatus.ACTIVE; }

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
