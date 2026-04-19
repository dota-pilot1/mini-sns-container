package com.cj.stayops.backend.payment.presentation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cj.stayops.backend.payment.application.RegisterManualPaymentUseCase;
import com.cj.stayops.backend.payment.application.dto.PaymentResult;
import com.cj.stayops.backend.payment.presentation.dto.PaymentResponse;
import com.cj.stayops.backend.payment.presentation.dto.RegisterPaymentRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payment", description = "결제(Payment) 관리 API")
public class PaymentController {

	private final RegisterManualPaymentUseCase registerManualPaymentUseCase;

	public PaymentController(RegisterManualPaymentUseCase registerManualPaymentUseCase) {
		this.registerManualPaymentUseCase = registerManualPaymentUseCase;
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
}
