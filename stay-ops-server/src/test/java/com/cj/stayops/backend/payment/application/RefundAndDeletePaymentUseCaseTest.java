package com.cj.stayops.backend.payment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.payment.application.dto.PaymentResult;
import com.cj.stayops.backend.payment.application.dto.RefundPaymentCommand;
import com.cj.stayops.backend.payment.application.dto.RegisterPaymentCommand;
import com.cj.stayops.backend.payment.domain.exception.InvalidPaymentFieldException;
import com.cj.stayops.backend.payment.domain.exception.PaymentNotFoundException;
import com.cj.stayops.backend.payment.domain.model.PaymentId;
import com.cj.stayops.backend.payment.domain.model.PaymentMethod;
import com.cj.stayops.backend.payment.domain.model.PaymentStatus;

class RefundAndDeletePaymentUseCaseTest {

	private static final Instant FIXED_NOW = Instant.parse("2026-04-19T10:00:00Z");

	private RegisterManualPaymentUseCaseTest.InMemoryPaymentRepository paymentRepository;
	private RegisterManualPaymentUseCaseTest.InMemoryContractRepository contractRepository;
	private Clock clock;
	private RegisterManualPaymentUseCase registerUseCase;
	private RefundPaymentUseCase refundUseCase;
	private DeletePaymentUseCase deleteUseCase;

	private Contract contract;

	@BeforeEach
	void setUp() {
		paymentRepository = new RegisterManualPaymentUseCaseTest.InMemoryPaymentRepository();
		contractRepository = new RegisterManualPaymentUseCaseTest.InMemoryContractRepository();
		clock = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
		registerUseCase = new RegisterManualPaymentUseCase(paymentRepository, contractRepository, clock);
		refundUseCase = new RefundPaymentUseCase(paymentRepository, clock);
		deleteUseCase = new DeletePaymentUseCase(paymentRepository);

		contract = Contract.create(
			ContractId.generate(), UUID.randomUUID(), UUID.randomUUID(),
			LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31),
			450_000L, 3_000_000L, FIXED_NOW
		);
		contractRepository.save(contract);
	}

	@Test
	@DisplayName("환불 → status=REFUNDED, refundedAt=now, note 가 있으면 덮어씀")
	void refund_marks_payment_as_refunded() {
		PaymentResult registered = registerUseCase.execute(new RegisterPaymentCommand(
			contract.id().asString(), "2026-04",
			450_000L, null, PaymentMethod.BANK_TRANSFER, "원본 메모"
		));

		PaymentResult refunded = refundUseCase.execute(
			new RefundPaymentCommand(registered.id(), "중도 퇴실 환불")
		);

		assertThat(refunded.status()).isEqualTo(PaymentStatus.REFUNDED);
		assertThat(refunded.refundedAt()).isEqualTo(FIXED_NOW);
		assertThat(refunded.note()).isEqualTo("중도 퇴실 환불");
	}

	@Test
	@DisplayName("환불 시 note 가 비어있으면 기존 note 유지")
	void refund_keeps_original_note_when_blank() {
		PaymentResult registered = registerUseCase.execute(new RegisterPaymentCommand(
			contract.id().asString(), "2026-04",
			450_000L, null, PaymentMethod.BANK_TRANSFER, "원본 메모"
		));

		PaymentResult refunded = refundUseCase.execute(
			new RefundPaymentCommand(registered.id(), null)
		);

		assertThat(refunded.note()).isEqualTo("원본 메모");
	}

	@Test
	@DisplayName("이미 REFUNDED 인 레코드는 다시 환불할 수 없다")
	void refund_twice_throws() {
		PaymentResult registered = registerUseCase.execute(new RegisterPaymentCommand(
			contract.id().asString(), "2026-04",
			450_000L, null, PaymentMethod.BANK_TRANSFER, null
		));
		refundUseCase.execute(new RefundPaymentCommand(registered.id(), null));

		assertThatThrownBy(() -> refundUseCase.execute(
			new RefundPaymentCommand(registered.id(), null)
		)).isInstanceOf(InvalidPaymentFieldException.class);
	}

	@Test
	@DisplayName("존재하지 않는 환불 요청 → PaymentNotFoundException")
	void refund_unknown_throws() {
		assertThatThrownBy(() -> refundUseCase.execute(
			new RefundPaymentCommand(UUID.randomUUID().toString(), null)
		)).isInstanceOf(PaymentNotFoundException.class);
	}

	@Test
	@DisplayName("DELETE → 레코드 영구 제거")
	void delete_removes_record() {
		PaymentResult registered = registerUseCase.execute(new RegisterPaymentCommand(
			contract.id().asString(), "2026-04",
			450_000L, null, PaymentMethod.BANK_TRANSFER, null
		));

		deleteUseCase.execute(registered.id());

		assertThat(paymentRepository.findById(PaymentId.of(registered.id()))).isEmpty();
	}

	@Test
	@DisplayName("존재하지 않는 ID 삭제 → PaymentNotFoundException")
	void delete_unknown_throws() {
		assertThatThrownBy(() -> deleteUseCase.execute(UUID.randomUUID().toString()))
			.isInstanceOf(PaymentNotFoundException.class);
	}
}
