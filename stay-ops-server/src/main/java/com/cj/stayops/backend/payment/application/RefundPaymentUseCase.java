package com.cj.stayops.backend.payment.application;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.payment.application.dto.PaymentResult;
import com.cj.stayops.backend.payment.application.dto.RefundPaymentCommand;
import com.cj.stayops.backend.payment.domain.exception.PaymentNotFoundException;
import com.cj.stayops.backend.payment.domain.model.Payment;
import com.cj.stayops.backend.payment.domain.model.PaymentId;
import com.cj.stayops.backend.payment.domain.repository.PaymentRepository;

/**
 * 환불 처리 — PAID → REFUNDED. 원본 레코드는 보존되고 status / refundedAt 만 갱신된다.
 */
@Service
public class RefundPaymentUseCase {

	private final PaymentRepository paymentRepository;
	private final Clock clock;

	public RefundPaymentUseCase(PaymentRepository paymentRepository, Clock clock) {
		this.paymentRepository = paymentRepository;
		this.clock = clock;
	}

	@Transactional
	public PaymentResult execute(RefundPaymentCommand cmd) {
		PaymentId id = PaymentId.of(cmd.paymentId());
		Payment payment = paymentRepository.findById(id)
			.orElseThrow(() -> new PaymentNotFoundException(cmd.paymentId()));
		Payment refunded = payment.refund(Instant.now(clock), cmd.note());
		return PaymentResult.from(paymentRepository.save(refunded));
	}
}
