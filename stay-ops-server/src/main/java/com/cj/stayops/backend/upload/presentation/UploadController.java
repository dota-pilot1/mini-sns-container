package com.cj.stayops.backend.upload.presentation;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cj.stayops.backend.upload.application.PresignUploadUseCase;
import com.cj.stayops.backend.upload.application.dto.PresignResult;
import com.cj.stayops.backend.upload.presentation.dto.PresignRequest;
import com.cj.stayops.backend.upload.presentation.dto.PresignResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/uploads")
@Tag(name = "Upload", description = "S3 업로드 공통 API")
public class UploadController {

	private final PresignUploadUseCase presignUploadUseCase;

	public UploadController(PresignUploadUseCase presignUploadUseCase) {
		this.presignUploadUseCase = presignUploadUseCase;
	}

	@PostMapping("/presign")
	@Operation(summary = "Presigned PUT URL 발급",
		description = "프론트가 S3 에 직접 업로드할 1회용 URL 을 발급한다. TTL 지나면 403.")
	public ResponseEntity<PresignResponse> presign(@Valid @RequestBody PresignRequest request) {
		PresignResult result = presignUploadUseCase.execute(request.toCommand());
		return ResponseEntity.ok(PresignResponse.from(result));
	}
}
