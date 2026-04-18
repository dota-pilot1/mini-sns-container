package com.cj.stayops.backend.room.domain.model;

/**
 * 방 상태.
 * <p>
 * MVP: 전이 제약 없이 자유롭게 변경 가능. 운영 규칙이 정해지면 전이 표를 도메인에 추가.
 */
public enum RoomStatus {
	/** 공실 */
	VACANT,
	/** 예약됨 */
	RESERVED,
	/** 입실 중 */
	OCCUPIED,
	/** 청소 중 */
	CLEANING,
	/** 수리 중 */
	MAINTENANCE
}
