package com.cj.stayops.backend.tenant.presentation;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cj.stayops.backend.auth.presentation.dto.ErrorResponse;
import com.cj.stayops.backend.tenant.application.CreateTenantUseCase;
import com.cj.stayops.backend.tenant.application.DeleteTenantUseCase;
import com.cj.stayops.backend.tenant.application.GetTenantUseCase;
import com.cj.stayops.backend.tenant.application.ListTenantsUseCase;
import com.cj.stayops.backend.tenant.application.UpdateTenantUseCase;
import com.cj.stayops.backend.tenant.application.dto.TenantResult;
import com.cj.stayops.backend.tenant.presentation.dto.CreateTenantRequest;
import com.cj.stayops.backend.tenant.presentation.dto.TenantResponse;
import com.cj.stayops.backend.tenant.presentation.dto.UpdateTenantRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tenants")
@Tag(name = "Tenant", description = "입주자(Tenant) 관리 API — 사람 정보만 담당. 계약은 /api/contracts 참조.")
public class TenantController {

	private final CreateTenantUseCase createTenantUseCase;
	private final UpdateTenantUseCase updateTenantUseCase;
	private final GetTenantUseCase getTenantUseCase;
	private final ListTenantsUseCase listTenantsUseCase;
	private final DeleteTenantUseCase deleteTenantUseCase;

	public TenantController(CreateTenantUseCase createTenantUseCase,
							UpdateTenantUseCase updateTenantUseCase,
							GetTenantUseCase getTenantUseCase,
							ListTenantsUseCase listTenantsUseCase,
							DeleteTenantUseCase deleteTenantUseCase) {
		this.createTenantUseCase = createTenantUseCase;
		this.updateTenantUseCase = updateTenantUseCase;
		this.getTenantUseCase = getTenantUseCase;
		this.listTenantsUseCase = listTenantsUseCase;
		this.deleteTenantUseCase = deleteTenantUseCase;
	}

	@PostMapping
	@Operation(summary = "입주자 등록")
	@ApiResponses({
		@ApiResponse(responseCode = "201", description = "등록 성공",
			content = @Content(schema = @Schema(implementation = TenantResponse.class))),
		@ApiResponse(responseCode = "400", description = "형식 오류",
			content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
	})
	public ResponseEntity<TenantResponse> create(@Valid @RequestBody CreateTenantRequest request) {
		TenantResult result = createTenantUseCase.execute(request.toCommand());
		return ResponseEntity.status(HttpStatus.CREATED).body(TenantResponse.from(result));
	}

	@GetMapping
	@Operation(summary = "입주자 목록 조회 — 전체. 거주중/퇴실 구분은 /api/contracts 로 판단.")
	public ResponseEntity<List<TenantResponse>> list() {
		List<TenantResponse> items = listTenantsUseCase.execute()
			.stream().map(TenantResponse::from).toList();
		return ResponseEntity.ok(items);
	}

	@GetMapping("/{tenantId}")
	@Operation(summary = "입주자 상세 조회")
	public ResponseEntity<TenantResponse> get(@PathVariable String tenantId) {
		return ResponseEntity.ok(TenantResponse.from(getTenantUseCase.execute(tenantId)));
	}

	@PatchMapping("/{tenantId}")
	@Operation(summary = "입주자 기본 정보 수정 (이름/전화/메모)")
	public ResponseEntity<TenantResponse> update(
		@PathVariable String tenantId,
		@Valid @RequestBody UpdateTenantRequest request
	) {
		TenantResult result = updateTenantUseCase.execute(request.toCommand(tenantId));
		return ResponseEntity.ok(TenantResponse.from(result));
	}

	@DeleteMapping("/{tenantId}")
	@Operation(summary = "입주자 완전 삭제", description = "관련 Contract 도 함께 제거됩니다. 복구 불가.")
	@ApiResponses({
		@ApiResponse(responseCode = "204", description = "삭제 성공"),
		@ApiResponse(responseCode = "404", description = "입주자 없음")
	})
	public ResponseEntity<Void> delete(@PathVariable String tenantId) {
		deleteTenantUseCase.execute(tenantId);
		return ResponseEntity.noContent().build();
	}
}
