package com.cj.stayops.backend.upload.presentation.dto;

import com.cj.stayops.backend.upload.application.dto.PresignCommand;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record PresignRequest(
	@NotBlank String scope,
	@NotBlank String refId,
	@NotBlank String filename,
	@NotBlank String contentType,
	@Positive long sizeBytes
) {
	public PresignCommand toCommand() {
		return new PresignCommand(scope, refId, filename, contentType, sizeBytes);
	}
}
