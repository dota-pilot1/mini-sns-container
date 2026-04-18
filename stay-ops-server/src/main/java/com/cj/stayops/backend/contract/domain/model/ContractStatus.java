package com.cj.stayops.backend.contract.domain.model;

/**
 * Contract 상태.
 * <ul>
 *   <li>ACTIVE — 현재 거주 중인 계약</li>
 *   <li>TERMINATED — 중도 퇴실 등 조기 종료</li>
 *   <li>EXPIRED — 기간 만료로 정상 종료 (배치/알림용 — 현재는 미사용)</li>
 * </ul>
 */
public enum ContractStatus {
	ACTIVE,
	TERMINATED,
	EXPIRED
}
