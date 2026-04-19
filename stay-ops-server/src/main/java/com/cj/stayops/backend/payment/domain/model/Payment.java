package com.cj.stayops.backend.payment.domain.model;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import com.cj.stayops.backend.payment.domain.exception.InvalidPaymentFieldException;

/**
 * Payment (결제) Aggregate Root.
 * <p>
 * 한 계약(Contract)의 한 달치 입금 한 건을 표현. 관리자가 입금 확인 시점에만 생성된다.
 * <p>
 * 불변식:
 * <ul>
 *   <li>amount &ge; 0</li>
 *   <li>(contractId, periodYearMonth, status=PAID) 는 시스템 전체에서 1건 — DB unique 제약</li>
 *   <li>status = REFUNDED 일 때 refundedAt 은 non-null</li>
 *   <li>PAID 만 refund 가능. REFUNDED 를 다시 환불할 수 없다.</li>
 * </ul>
 */
public class Payment {

	private final PaymentId id;
	private final UUID contractId;
	private final PeriodYearMonth periodYearMonth;
	private final long amount;
	private final Instant paidAt;
	private final PaymentMethod method;
	private final PaymentStatus status;
	private final Instant refundedAt;   // nullable
	private final String note;          // nullable
	private final Instant createdAt;

	private Payment(PaymentId id, UUID contractId, PeriodYearMonth periodYearMonth,
					long amount, Instant paidAt, PaymentMethod method,
					PaymentStatus status, Instant refundedAt, String note,
					Instant createdAt) {
		this.id = Objects.requireNonNull(id, "id");
		this.contractId = Objects.requireNonNull(contractId, "contractId");
		this.periodYearMonth = Objects.requireNonNull(periodYearMonth, "periodYearMonth");
		this.amount = amount;
		this.paidAt = Objects.requireNonNull(paidAt, "paidAt");
		this.method = Objects.requireNonNull(method, "method");
		this.status = Objects.requireNonNull(status, "status");
		this.refundedAt = refundedAt;
		this.note = note;
		this.createdAt = Objects.requireNonNull(createdAt, "createdAt");

		if (status == PaymentStatus.REFUNDED && refundedAt == null) {
			throw new InvalidPaymentFieldException("refundedAt",
				"환불 상태에서는 refundedAt 이 필수입니다.");
		}
	}

	/** 신규 입금 등록 — 항상 PAID 상태로 시작. */
	public static Payment register(PaymentId id, UUID contractId, PeriodYearMonth period,
								   long amount, Instant paidAt, PaymentMethod method,
								   String note, Instant now) {
		validateAmount(amount);
		Objects.requireNonNull(paidAt, "paidAt");
		return new Payment(id, contractId, period, amount, paidAt, method,
			PaymentStatus.PAID, null, normalizeNote(note), now);
	}

	public static Payment reconstitute(PaymentId id, UUID contractId, PeriodYearMonth period,
									   long amount, Instant paidAt, PaymentMethod method,
									   PaymentStatus status, Instant refundedAt, String note,
									   Instant createdAt) {
		return new Payment(id, contractId, period, amount, paidAt, method,
			status, refundedAt, note, createdAt);
	}

	/** 환불 처리 — PAID → REFUNDED. note 가 주어지면 기존 note 를 덮어쓴다. */
	public Payment refund(Instant refundedAt, String refundNote) {
		if (status != PaymentStatus.PAID) {
			throw new InvalidPaymentFieldException("status",
				"PAID 상태의 결제만 환불할 수 있습니다. 현재 상태: " + status);
		}
		Objects.requireNonNull(refundedAt, "refundedAt");
		String newNote = (refundNote == null || refundNote.isBlank()) ? this.note : refundNote.trim();
		return new Payment(id, contractId, periodYearMonth, amount, paidAt, method,
			PaymentStatus.REFUNDED, refundedAt, newNote, createdAt);
	}

	private static void validateAmount(long amount) {
		if (amount < 0) {
			throw new InvalidPaymentFieldException("amount", "금액은 0 이상이어야 합니다.");
		}
	}

	private static String normalizeNote(String note) {
		if (note == null) return null;
		String trimmed = note.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	// ---------- accessors ----------

	public PaymentId id() { return id; }
	public UUID contractId() { return contractId; }
	public PeriodYearMonth periodYearMonth() { return periodYearMonth; }
	public long amount() { return amount; }
	public Instant paidAt() { return paidAt; }
	public PaymentMethod method() { return method; }
	public PaymentStatus status() { return status; }
	public Instant refundedAt() { return refundedAt; }
	public String note() { return note; }
	public Instant createdAt() { return createdAt; }

	public boolean isPaid() { return status == PaymentStatus.PAID; }
	public boolean isRefunded() { return status == PaymentStatus.REFUNDED; }

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof Payment other)) return false;
		return id.equals(other.id);
	}

	@Override
	public int hashCode() {
		return id.hashCode();
	}
}
