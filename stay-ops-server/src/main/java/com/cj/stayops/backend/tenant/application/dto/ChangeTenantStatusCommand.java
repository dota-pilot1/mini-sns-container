package com.cj.stayops.backend.tenant.application.dto;

import com.cj.stayops.backend.tenant.domain.model.TenantStatus;

public record ChangeTenantStatusCommand(String tenantId, TenantStatus newStatus) { }
