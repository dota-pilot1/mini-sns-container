package com.cj.stayops.backend.tenant.application.dto;

public record CreateTenantCommand(
	String userId,     // nullable — 기존 User 와 연결된 경우
	String name,
	String phoneNumber,
	String memo
) { }
