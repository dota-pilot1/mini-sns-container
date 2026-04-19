package com.cj.stayops.backend.contract.presentation;

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

import com.cj.stayops.backend.contract.application.CancelOccupancyUseCase;
import com.cj.stayops.backend.contract.application.CreateContractUseCase;
import com.cj.stayops.backend.contract.application.DeleteContractUseCase;
import com.cj.stayops.backend.contract.application.ExtendAndPayUseCase;
import com.cj.stayops.backend.contract.application.GetContractUseCase;
import com.cj.stayops.backend.contract.application.ListContractsUseCase;
import com.cj.stayops.backend.contract.application.TerminateContractUseCase;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;

import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.application.dto.ListContractsQuery;
import com.cj.stayops.backend.contract.presentation.dto.CancelOccupancyRequest;
import com.cj.stayops.backend.contract.presentation.dto.CancelOccupancyResponse;
import com.cj.stayops.backend.contract.presentation.dto.ContractResponse;
import com.cj.stayops.backend.contract.presentation.dto.CreateContractRequest;
import com.cj.stayops.backend.contract.presentation.dto.ExtendAndPayRequest;
import com.cj.stayops.backend.contract.presentation.dto.ExtendAndPayResponse;
import com.cj.stayops.backend.contract.presentation.dto.TerminateContractRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/contracts")
@Tag(name = "Contract", description = "계약(Contract) 관리 API")
public class ContractController {

	private final CreateContractUseCase createContractUseCase;
	private final ListContractsUseCase listContractsUseCase;
	private final GetContractUseCase getContractUseCase;
	private final TerminateContractUseCase terminateContractUseCase;
	private final DeleteContractUseCase deleteContractUseCase;
	private final ExtendAndPayUseCase extendAndPayUseCase;
	private final CancelOccupancyUseCase cancelOccupancyUseCase;

	public ContractController(CreateContractUseCase createContractUseCase,
							  ListContractsUseCase listContractsUseCase,
							  GetContractUseCase getContractUseCase,
							  TerminateContractUseCase terminateContractUseCase,
							  DeleteContractUseCase deleteContractUseCase,
							  ExtendAndPayUseCase extendAndPayUseCase,
							  CancelOccupancyUseCase cancelOccupancyUseCase) {
		this.createContractUseCase = createContractUseCase;
		this.listContractsUseCase = listContractsUseCase;
		this.getContractUseCase = getContractUseCase;
		this.terminateContractUseCase = terminateContractUseCase;
		this.deleteContractUseCase = deleteContractUseCase;
		this.extendAndPayUseCase = extendAndPayUseCase;
		this.cancelOccupancyUseCase = cancelOccupancyUseCase;
	}

	@PostMapping
	@Operation(summary = "계약 생성", description = "Tenant + Room 조합으로 신규 계약을 만듭니다 (ACTIVE).")
	public ResponseEntity<ContractResponse> create(@Valid @RequestBody CreateContractRequest request) {
		ContractResult result = createContractUseCase.execute(request.toCommand());
		return ResponseEntity.status(HttpStatus.CREATED).body(ContractResponse.from(result));
	}

	@GetMapping
	@Operation(summary = "계약 목록 조회",
		description = "tenantId/roomId 필터. effectiveOn 을 주면 해당 날짜에 유효한(startDate ≤ date ≤ endDate) 계약만 반환.")
	public ResponseEntity<List<ContractResponse>> list(
		@RequestParam(required = false) UUID tenantId,
		@RequestParam(required = false) UUID roomId,
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate effectiveOn
	) {
		List<ContractResponse> items = listContractsUseCase.execute(
				new ListContractsQuery(tenantId, roomId, effectiveOn)
			).stream()
			.map(ContractResponse::from)
			.toList();
		return ResponseEntity.ok(items);
	}

	@GetMapping("/{contractId}")
	@Operation(summary = "계약 상세 조회")
	public ResponseEntity<ContractResponse> get(@PathVariable String contractId) {
		return ResponseEntity.ok(ContractResponse.from(getContractUseCase.execute(contractId)));
	}

	@DeleteMapping("/{contractId}")
	@Operation(summary = "계약 완전 삭제",
		description = "잘못 입력한 계약 복구용. 결제 레코드도 함께 hard-delete 되며, "
			+ "정상 종료는 /terminate 사용. 방의 다른 ACTIVE 계약이 없으면 Room 상태도 VACANT 로 되돌림.")
	public ResponseEntity<Void> delete(@PathVariable String contractId) {
		deleteContractUseCase.execute(contractId);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/{contractId}/terminate")
	@Operation(summary = "계약 중도 종료 (퇴실)",
		description = "status 를 TERMINATED 로 바꾸고 endDate 를 종료일로 업데이트합니다.")
	public ResponseEntity<ContractResponse> terminate(
		@PathVariable String contractId,
		@Valid @RequestBody(required = false) TerminateContractRequest request
	) {
		TerminateContractRequest body = request == null
			? new TerminateContractRequest(null)
			: request;
		ContractResult result = terminateContractUseCase.execute(body.toCommand(contractId));
		return ResponseEntity.ok(ContractResponse.from(result));
	}

	@PostMapping("/{contractId}/cancel-occupancy")
	@Operation(summary = "퇴실 취소 (계약 종료 + 일괄 환불)",
		description = "계약을 TERMINATED 로 바꾸고, 해당 계약의 모든 PAID 결제를 REFUNDED 로 전환합니다. "
			+ "응답의 usedAmount / depositRefunded 는 안내용 권장값이며 실제 DB 금액 변경은 없습니다.")
	public ResponseEntity<CancelOccupancyResponse> cancelOccupancy(
		@PathVariable String contractId,
		@Valid @RequestBody(required = false) CancelOccupancyRequest request
	) {
		CancelOccupancyRequest body = request == null
			? new CancelOccupancyRequest(null, null)
			: request;
		return ResponseEntity.ok(
			CancelOccupancyResponse.from(cancelOccupancyUseCase.execute(body.toCommand(contractId)))
		);
	}

	@PostMapping("/{contractId}/extend-and-pay")
	@Operation(summary = "계약 연장 + 결제",
		description = "endDate 를 N 개월 연장하고, 연장된 각 월에 대해 PAID 결제 레코드를 생성합니다.")
	public ResponseEntity<ExtendAndPayResponse> extendAndPay(
		@PathVariable String contractId,
		@Valid @RequestBody ExtendAndPayRequest request
	) {
		return ResponseEntity.ok(
			ExtendAndPayResponse.from(extendAndPayUseCase.execute(request.toCommand(contractId)))
		);
	}
}
