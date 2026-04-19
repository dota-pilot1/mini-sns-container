package com.cj.stayops.backend.upload.presentation.dto;

import com.cj.stayops.backend.upload.application.dto.PresignResult;

public record PresignResponse(
	String key,
	String uploadUrl,
	long expiresInSeconds
) {
	public static PresignResponse from(PresignResult r) {
		return new PresignResponse(r.key(), r.uploadUrl(), r.expiresInSeconds());
	}
}
