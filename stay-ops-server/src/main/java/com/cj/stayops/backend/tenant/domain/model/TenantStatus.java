package com.cj.stayops.backend.tenant.domain.model;

/**
 * 입주자 상태. "테이블 이동" 이 아니라 같은 레코드의 상태 전이로 생애주기를 표현한다.
 * <p>
 * MVP: 전이 제약 없이 자유롭게 변경 가능 (칸반 드래그앤드롭 UX 수용).
 * 향후 운영 규칙이 정해지면 전이표(state table)를 도메인에 추가한다.
 */
public enum TenantStatus {
	/** 예약 — 입주 예정 (계약 전/준비중). */
	RESERVED,
	/** 거주 중. */
	ACTIVE,
	/** 퇴실 완료 — 이력 조회 용도로 레코드는 보존. */
	MOVED_OUT
}
