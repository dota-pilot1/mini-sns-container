package com.cj.stayops.backend.contract.application.dto;

import java.util.UUID;

import com.cj.stayops.backend.contract.domain.model.ContractStatus;

public record ListContractsQuery(UUID tenantId, UUID roomId, ContractStatus status) { }
