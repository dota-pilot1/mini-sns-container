package com.cj.stayops.backend.payment.infrastructure.persistence;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Payment 의 JPA 매핑.
 * <p>
 * (contract_id, period_year_month) 한 쌍에 PAID 레코드는 1건이지만, REFUNDED 는
 * 여러 건 가능하다. PostgreSQL 의 partial unique index 가 이상적이지만 JPA 표준 매핑으로는
 * 표현할 수 없으므로, 여기서는 (contract_id, period_year_month, status) 전체 조합에
 * unique 를 걸고 — REFUNDED 가 둘 이상 생기는 시나리오는 어차피 발생하지 않는다
 * (refund 는 PAID → REFUNDED 단방향 1회 트랜지션). 추가 PAID 시도는 application 레이어
 * {@code existsPaid()} 로 사전 차단하고, 최종 안전장치로 unique 제약이 잡아준다.
 */
@Entity
@Table(name = "payments",
	indexes = {
		@Index(name = "idx_payments_contract", columnList = "contract_id"),
		@Index(name = "idx_payments_period", columnList = "period_year_month"),
		@Index(name = "idx_payments_status", columnList = "status")
	},
	uniqueConstraints = {
		@UniqueConstraint(
			name = "uq_payments_contract_period_status",
			columnNames = {"contract_id", "period_year_month", "status"}
		)
	}
)
public class PaymentJpaEntity {

	@Id
	@Column(columnDefinition = "uuid")
	private UUID id;

	@Column(name = "contract_id", nullable = false, columnDefinition = "uuid")
	private UUID contractId;

	@Column(name = "period_year_month", nullable = false, length = 7)
	private String periodYearMonth;

	@Column(nullable = false)
	private long amount;

	@Column(name = "paid_at", nullable = false)
	private Instant paidAt;

	@Column(nullable = false, length = 20)
	private String method;

	@Column(nullable = false, length = 20)
	private String status;

	@Column(name = "refunded_at")
	private Instant refundedAt;

	@Column(length = 500)
	private String note;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected PaymentJpaEntity() { }

	public PaymentJpaEntity(UUID id, UUID contractId, String periodYearMonth,
							long amount, Instant paidAt, String method, String status,
							Instant refundedAt, String note, Instant createdAt) {
		this.id = id;
		this.contractId = contractId;
		this.periodYearMonth = periodYearMonth;
		this.amount = amount;
		this.paidAt = paidAt;
		this.method = method;
		this.status = status;
		this.refundedAt = refundedAt;
		this.note = note;
		this.createdAt = createdAt;
	}

	public UUID getId() { return id; }
	public UUID getContractId() { return contractId; }
	public String getPeriodYearMonth() { return periodYearMonth; }
	public long getAmount() { return amount; }
	public Instant getPaidAt() { return paidAt; }
	public String getMethod() { return method; }
	public String getStatus() { return status; }
	public Instant getRefundedAt() { return refundedAt; }
	public String getNote() { return note; }
	public Instant getCreatedAt() { return createdAt; }
}
