package com.cj.stayops.backend.payment.presentation;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cj.stayops.backend.payment.application.DeletePaymentUseCase;
import com.cj.stayops.backend.payment.application.ListOverdueUseCase;
import com.cj.stayops.backend.payment.application.ListPaymentsUseCase;
import com.cj.stayops.backend.payment.application.RefundPaymentUseCase;
import com.cj.stayops.backend.payment.application.RegisterManualPaymentUseCase;
import com.cj.stayops.backend.payment.application.dto.ListPaymentsQuery;
import com.cj.stayops.backend.payment.application.dto.PaymentResult;
import com.cj.stayops.backend.payment.domain.model.PaymentStatus;
import com.cj.stayops.backend.payment.domain.model.PeriodYearMonth;
import com.cj.stayops.backend.payment.presentation.dto.OverduePaymentResponse;
import com.cj.stayops.backend.payment.presentation.dto.PaymentResponse;
import com.cj.stayops.backend.payment.presentation.dto.RefundPaymentRequest;
import com.cj.stayops.backend.payment.presentation.dto.RegisterPaymentRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payment", description = "결제(Payment) 관리 API")
public class PaymentController {

	private final RegisterManualPaymentUseCase registerManualPaymentUseCase;
	private final ListOverdueUseCase listOverdueUseCase;
	private final ListPaymentsUseCase listPaymentsUseCase;
	private final RefundPaymentUseCase refundPaymentUseCase;
	private final DeletePaymentUseCase deletePaymentUseCase;

	public PaymentController(RegisterManualPaymentUseCase registerManualPaymentUseCase,
							 ListOverdueUseCase listOverdueUseCase,
							 ListPaymentsUseCase listPaymentsUseCase,
							 RefundPaymentUseCase refundPaymentUseCase,
							 DeletePaymentUseCase deletePaymentUseCase) {
		this.registerManualPaymentUseCase = registerManualPaymentUseCase;
		this.listOverdueUseCase = listOverdueUseCase;
		this.listPaymentsUseCase = listPaymentsUseCase;
		this.refundPaymentUseCase = refundPaymentUseCase;
		this.deletePaymentUseCase = deletePaymentUseCase;
	}

	@PostMapping
	@Operation(summary = "수동 입금 확인 등록",
		description = "관리자가 입금된 사실을 직접 확인 후 PAID 레코드를 생성합니다.")
	public ResponseEntity<PaymentResponse> register(
		@Valid @RequestBody RegisterPaymentRequest request
	) {
		PaymentResult result = registerManualPaymentUseCase.execute(request.toCommand());
		return ResponseEntity.status(HttpStatus.CREATED).body(PaymentResponse.from(result));
	}

	@GetMapping
	@Operation(summary = "결제 목록 조회",
		description = "contractId / period(YYYY-MM) / status 필터 지원. paidAt 내림차순.")
	public ResponseEntity<List<PaymentResponse>> list(
		@RequestParam(required = false) UUID contractId,
		@RequestParam(required = false) String period,
		@RequestParam(required = false) PaymentStatus status
	) {
		List<PaymentResponse> items = listPaymentsUseCase
			.execute(new ListPaymentsQuery(contractId, period, status))
			.stream()
			.map(PaymentResponse::from)
			.toList();
		return ResponseEntity.ok(items);
	}

	@GetMapping("/overdue")
	@Operation(summary = "기준월 미납자 목록",
		description = "ACTIVE 계약 중 해당 월에 PAID 결제 레코드가 없는 계약을 반환합니다.")
	public ResponseEntity<List<OverduePaymentResponse>> overdue(
		@RequestParam("period") String period
	) {
		PeriodYearMonth periodVo = PeriodYearMonth.of(period);
		List<OverduePaymentResponse> items = listOverdueUseCase.execute(periodVo).stream()
			.map(OverduePaymentResponse::from)
			.toList();
		return ResponseEntity.ok(items);
	}

	@PostMapping("/{paymentId}/refund")
	@Operation(summary = "환불 처리",
		description = "PAID → REFUNDED. 원본 보존 (soft delete).")
	public ResponseEntity<PaymentResponse> refund(
		@PathVariable String paymentId,
		@Valid @RequestBody(required = false) RefundPaymentRequest request
	) {
		RefundPaymentRequest body = request == null ? new RefundPaymentRequest(null) : request;
		PaymentResult result = refundPaymentUseCase.execute(body.toCommand(paymentId));
		return ResponseEntity.ok(PaymentResponse.from(result));
	}

	@DeleteMapping("/{paymentId}")
	@Operation(summary = "결제 레코드 완전 삭제",
		description = "잘못 입력한 레코드 복구용. 환불과는 다른 동작이며 UI 에서 confirm 강제.")
	public ResponseEntity<Void> delete(@PathVariable String paymentId) {
		deletePaymentUseCase.execute(paymentId);
		return ResponseEntity.noContent().build();
	}
}
