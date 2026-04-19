package com.cj.stayops.backend.payment.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.payment.domain.exception.PaymentNotFoundException;
import com.cj.stayops.backend.payment.domain.model.PaymentId;
import com.cj.stayops.backend.payment.domain.repository.PaymentRepository;

/**
 * 결제 레코드 완전 삭제. 환불(soft delete)과 별개로,
 * "잘못 입력한 레코드 복구" 용으로만 사용한다 (UI 에서 confirm 강제).
 */
@Service
public class DeletePaymentUseCase {

	private final PaymentRepository paymentRepository;

	public DeletePaymentUseCase(PaymentRepository paymentRepository) {
		this.paymentRepository = paymentRepository;
	}

	@Transactional
	public void execute(String paymentId) {
		PaymentId id = PaymentId.of(paymentId);
		paymentRepository.findById(id)
			.orElseThrow(() -> new PaymentNotFoundException(paymentId));
		paymentRepository.deleteById(id);
	}
}
