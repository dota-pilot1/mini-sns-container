package com.cj.stayops.backend.tenant.application.dto;

public record UpdateTenantCommand(
	String tenantId,
	String name,
	String phoneNumber,
	String memo
) { }
