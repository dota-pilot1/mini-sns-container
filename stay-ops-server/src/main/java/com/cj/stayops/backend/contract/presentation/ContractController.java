package com.cj.stayops.backend.contract.presentation;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cj.stayops.backend.contract.application.CreateContractUseCase;
import com.cj.stayops.backend.contract.application.GetContractUseCase;
import com.cj.stayops.backend.contract.application.ListContractsUseCase;
import com.cj.stayops.backend.contract.application.TerminateContractUseCase;
import com.cj.stayops.backend.contract.application.dto.ContractResult;
import com.cj.stayops.backend.contract.application.dto.ListContractsQuery;
import com.cj.stayops.backend.contract.domain.model.ContractStatus;
import com.cj.stayops.backend.contract.presentation.dto.ContractResponse;
import com.cj.stayops.backend.contract.presentation.dto.CreateContractRequest;
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

	public ContractController(CreateContractUseCase createContractUseCase,
							  ListContractsUseCase listContractsUseCase,
							  GetContractUseCase getContractUseCase,
							  TerminateContractUseCase terminateContractUseCase) {
		this.createContractUseCase = createContractUseCase;
		this.listContractsUseCase = listContractsUseCase;
		this.getContractUseCase = getContractUseCase;
		this.terminateContractUseCase = terminateContractUseCase;
	}

	@PostMapping
	@Operation(summary = "계약 생성", description = "Tenant + Room 조합으로 신규 계약을 만듭니다 (ACTIVE).")
	public ResponseEntity<ContractResponse> create(@Valid @RequestBody CreateContractRequest request) {
		ContractResult result = createContractUseCase.execute(request.toCommand());
		return ResponseEntity.status(HttpStatus.CREATED).body(ContractResponse.from(result));
	}

	@GetMapping
	@Operation(summary = "계약 목록 조회", description = "tenantId/roomId/status 필터 지원.")
	public ResponseEntity<List<ContractResponse>> list(
		@RequestParam(required = false) UUID tenantId,
		@RequestParam(required = false) UUID roomId,
		@RequestParam(required = false) ContractStatus status
	) {
		List<ContractResponse> items = listContractsUseCase.execute(
				new ListContractsQuery(tenantId, roomId, status)
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
}
