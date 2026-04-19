package com.cj.stayops.backend.payment.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.cj.stayops.backend.payment.domain.model.Payment;
import com.cj.stayops.backend.payment.domain.model.PaymentId;
import com.cj.stayops.backend.payment.domain.model.PaymentMethod;
import com.cj.stayops.backend.payment.domain.model.PaymentStatus;
import com.cj.stayops.backend.payment.domain.model.PeriodYearMonth;
import com.cj.stayops.backend.payment.domain.repository.PaymentRepository;

@Repository
public class PaymentRepositoryImpl implements PaymentRepository {

	private final PaymentJpaRepository jpaRepository;

	public PaymentRepositoryImpl(PaymentJpaRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	public Payment save(Payment payment) {
		PaymentJpaEntity saved = jpaRepository.save(toEntity(payment));
		return toDomain(saved);
	}

	@Override
	public Optional<Payment> findById(PaymentId id) {
		return jpaRepository.findById(id.value()).map(this::toDomain);
	}

	@Override
	public List<Payment> findAll(UUID contractId, PeriodYearMonth period,
								 PeriodYearMonth fromPeriod, PeriodYearMonth toPeriod,
								 PaymentStatus status) {
		return jpaRepository.findAllByFilters(
				contractId,
				period == null ? null : period.asString(),
				fromPeriod == null ? null : fromPeriod.asString(),
				toPeriod == null ? null : toPeriod.asString(),
				status == null ? null : status.name()
			).stream()
			.map(this::toDomain)
			.toList();
	}

	@Override
	public boolean existsPaid(UUID contractId, PeriodYearMonth period) {
		return jpaRepository.existsPaid(contractId, period.asString());
	}

	@Override
	public List<UUID> findContractIdsWithPaidIn(List<UUID> contractIds, PeriodYearMonth period) {
		if (contractIds == null || contractIds.isEmpty()) {
			return List.of();
		}
		return jpaRepository.findContractIdsWithPaidIn(contractIds, period.asString());
	}

	@Override
	public void deleteById(PaymentId id) {
		jpaRepository.deleteById(id.value());
	}

	@Override
	public void deleteByContractId(UUID contractId) {
		jpaRepository.deleteByContractId(contractId);
	}

	private PaymentJpaEntity toEntity(Payment p) {
		return new PaymentJpaEntity(
			p.id().value(),
			p.contractId(),
			p.periodYearMonth().asString(),
			p.amount(),
			p.paidAt(),
			p.method().name(),
			p.status().name(),
			p.refundedAt(),
			p.note(),
			p.createdAt()
		);
	}

	private Payment toDomain(PaymentJpaEntity e) {
		return Payment.reconstitute(
			PaymentId.of(e.getId()),
			e.getContractId(),
			PeriodYearMonth.of(e.getPeriodYearMonth()),
			e.getAmount(),
			e.getPaidAt(),
			PaymentMethod.valueOf(e.getMethod()),
			PaymentStatus.valueOf(e.getStatus()),
			e.getRefundedAt(),
			e.getNote(),
			e.getCreatedAt()
		);
	}
}
