package com.cj.stayops.backend.upload.application.dto;

public record PresignResult(
	String key,
	String uploadUrl,
	long expiresInSeconds
) {}
