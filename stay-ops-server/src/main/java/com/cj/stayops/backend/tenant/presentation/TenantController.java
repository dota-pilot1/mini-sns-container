package com.cj.stayops.backend.tenant.presentation;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cj.stayops.backend.auth.presentation.dto.ErrorResponse;
import com.cj.stayops.backend.tenant.application.ChangeTenantStatusUseCase;
import com.cj.stayops.backend.tenant.application.CreateTenantUseCase;
import com.cj.stayops.backend.tenant.application.DeleteTenantUseCase;
import com.cj.stayops.backend.tenant.application.GetTenantUseCase;
import com.cj.stayops.backend.tenant.application.HardDeleteTenantUseCase;
import com.cj.stayops.backend.tenant.application.ListTenantsUseCase;
import com.cj.stayops.backend.tenant.application.RestoreTenantUseCase;
import com.cj.stayops.backend.tenant.application.UpdateTenantUseCase;
import com.cj.stayops.backend.tenant.application.dto.ListTenantsQuery;
import com.cj.stayops.backend.tenant.application.dto.TenantResult;
import com.cj.stayops.backend.tenant.domain.model.TenantStatus;
import com.cj.stayops.backend.tenant.presentation.dto.ChangeTenantStatusRequest;
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

/**
 * 입주자(Tenant) 관리 API.
 */
@RestController
@RequestMapping("/api/tenants")
@Tag(name = "Tenant", description = "입주자(Tenant) 관리 API")
public class TenantController {

	private final CreateTenantUseCase createTenantUseCase;
	private final UpdateTenantUseCase updateTenantUseCase;
	private final ChangeTenantStatusUseCase changeTenantStatusUseCase;
	private final GetTenantUseCase getTenantUseCase;
	private final ListTenantsUseCase listTenantsUseCase;
	private final DeleteTenantUseCase deleteTenantUseCase;
	private final RestoreTenantUseCase restoreTenantUseCase;
	private final HardDeleteTenantUseCase hardDeleteTenantUseCase;

	public TenantController(CreateTenantUseCase createTenantUseCase,
							UpdateTenantUseCase updateTenantUseCase,
							ChangeTenantStatusUseCase changeTenantStatusUseCase,
							GetTenantUseCase getTenantUseCase,
							ListTenantsUseCase listTenantsUseCase,
							DeleteTenantUseCase deleteTenantUseCase,
							RestoreTenantUseCase restoreTenantUseCase,
							HardDeleteTenantUseCase hardDeleteTenantUseCase) {
		this.createTenantUseCase = createTenantUseCase;
		this.updateTenantUseCase = updateTenantUseCase;
		this.changeTenantStatusUseCase = changeTenantStatusUseCase;
		this.getTenantUseCase = getTenantUseCase;
		this.listTenantsUseCase = listTenantsUseCase;
		this.deleteTenantUseCase = deleteTenantUseCase;
		this.restoreTenantUseCase = restoreTenantUseCase;
		this.hardDeleteTenantUseCase = hardDeleteTenantUseCase;
	}

	@PostMapping
	@Operation(summary = "입주자 등록", description = "신규 입주자를 등록합니다.")
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
	@Operation(summary = "입주자 목록 조회",
		description = "필터 조건(상태/방)으로 목록 조회. deletedOnly=true 이면 퇴실(soft-deleted)만 반환합니다.")
	public ResponseEntity<List<TenantResponse>> list(
		@RequestParam(required = false) TenantStatus status,
		@RequestParam(required = false) UUID roomId,
		@RequestParam(required = false, defaultValue = "false") boolean deletedOnly
	) {
		List<TenantResponse> items = listTenantsUseCase.execute(new ListTenantsQuery(status, roomId, deletedOnly))
			.stream()
			.map(TenantResponse::from)
			.toList();
		return ResponseEntity.ok(items);
	}

	@GetMapping("/{tenantId}")
	@Operation(summary = "입주자 상세 조회")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "조회 성공"),
		@ApiResponse(responseCode = "404", description = "입주자 없음",
			content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
	})
	public ResponseEntity<TenantResponse> get(@PathVariable String tenantId) {
		TenantResult result = getTenantUseCase.execute(tenantId);
		return ResponseEntity.ok(TenantResponse.from(result));
	}

	@PatchMapping("/{tenantId}")
	@Operation(summary = "입주자 정보 수정", description = "null 필드는 변경하지 않습니다 (PATCH 시맨틱).")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "수정 성공"),
		@ApiResponse(responseCode = "400", description = "형식 오류"),
		@ApiResponse(responseCode = "404", description = "입주자 없음")
	})
	public ResponseEntity<TenantResponse> update(
		@PathVariable String tenantId,
		@Valid @RequestBody UpdateTenantRequest request
	) {
		TenantResult result = updateTenantUseCase.execute(request.toCommand(tenantId));
		return ResponseEntity.ok(TenantResponse.from(result));
	}

	@PatchMapping("/{tenantId}/status")
	@Operation(summary = "입주자 상태 변경")
	public ResponseEntity<TenantResponse> changeStatus(
		@PathVariable String tenantId,
		@Valid @RequestBody ChangeTenantStatusRequest request
	) {
		TenantResult result = changeTenantStatusUseCase.execute(request.toCommand(tenantId));
		return ResponseEntity.ok(TenantResponse.from(result));
	}

	@DeleteMapping("/{tenantId}")
	@Operation(summary = "입주자 퇴실 (soft)", description = "deleted_at 을 세팅. 퇴실 컬럼에서 계속 조회 가능.")
	@ApiResponses({
		@ApiResponse(responseCode = "204", description = "퇴실 처리 성공"),
		@ApiResponse(responseCode = "404", description = "입주자 없음")
	})
	public ResponseEntity<Void> delete(@PathVariable String tenantId) {
		deleteTenantUseCase.execute(tenantId);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/{tenantId}/restore")
	@Operation(summary = "퇴실 입주자 복원", description = "deleted_at 을 null 로 되돌려 거주중 목록에 복귀시킵니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "복원 성공"),
		@ApiResponse(responseCode = "404", description = "입주자 없음")
	})
	public ResponseEntity<TenantResponse> restore(@PathVariable String tenantId) {
		TenantResult result = restoreTenantUseCase.execute(tenantId);
		return ResponseEntity.ok(TenantResponse.from(result));
	}

	@DeleteMapping("/{tenantId}/permanent")
	@Operation(summary = "입주자 완전 삭제 (hard)", description = "DB 에서 물리적으로 제거. 복구 불가.")
	@ApiResponses({
		@ApiResponse(responseCode = "204", description = "완전 삭제 성공"),
		@ApiResponse(responseCode = "404", description = "입주자 없음")
	})
	public ResponseEntity<Void> hardDelete(@PathVariable String tenantId) {
		hardDeleteTenantUseCase.execute(tenantId);
		return ResponseEntity.noContent().build();
	}
}
