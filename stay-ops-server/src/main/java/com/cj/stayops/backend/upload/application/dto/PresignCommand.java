package com.cj.stayops.backend.upload.application.dto;

/**
 * presign 발급 요청.
 * <p>
 * scope: 현재는 "room" 만 지원. 확장 시 여기에 enum 으로 승격.
 */
public record PresignCommand(
	String scope,
	String refId,
	String filename,
	String contentType,
	long sizeBytes
) {}
