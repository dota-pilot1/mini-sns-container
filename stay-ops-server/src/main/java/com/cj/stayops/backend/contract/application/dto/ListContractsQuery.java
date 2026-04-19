package com.cj.stayops.backend.contract.application.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * 계약 목록 조회 쿼리.
 *
 * <p>{@code effectiveOn} 이 null 이 아니면 해당 날짜에 유효한(startDate ≤ date ≤ endDate)
 * 계약만 반환. null 이면 소프트 삭제 제외 전체.
 */
public record ListContractsQuery(UUID tenantId, UUID roomId, LocalDate effectiveOn) { }
