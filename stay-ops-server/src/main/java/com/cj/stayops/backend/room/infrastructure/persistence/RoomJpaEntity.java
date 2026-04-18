package com.cj.stayops.backend.room.infrastructure.persistence;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * Room Aggregate 의 JPA 영속화 전용 엔티티.
 * <p>
 * - options: CSV 문자열로 저장 (MVP 단순화; 조건 검색 필요 시 별도 테이블 승격)
 * - deletedAt: soft delete. null 이면 활성 상태.
 */
@Entity
@Table(name = "rooms", indexes = {
	@Index(name = "uk_rooms_room_number", columnList = "room_number", unique = true)
})
public class RoomJpaEntity {

	@Id
	@Column(name = "id", columnDefinition = "uuid", nullable = false, updatable = false)
	private UUID id;

	@Column(name = "room_number", nullable = false, length = 10, unique = true)
	private String roomNumber;

	@Column(name = "floor", nullable = false)
	private int floor;

	@Column(name = "size_pyeong", nullable = false, precision = 4, scale = 1)
	private BigDecimal sizePyeong;

	@Column(name = "room_type", nullable = false, length = 20)
	private String roomType;

	@Column(name = "monthly_rent", nullable = false)
	private long monthlyRent;

	@Column(name = "deposit", nullable = false)
	private long deposit;

	@Column(name = "status", nullable = false, length = 20)
	private String status;

	/** CSV: "AIRCON,WINDOW" */
	@Column(name = "options", length = 255)
	private String optionsCsv;

	@Column(name = "memo", length = 500)
	private String memo;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Column(name = "deleted_at")
	private Instant deletedAt;

	protected RoomJpaEntity() {
	}

	public RoomJpaEntity(UUID id, String roomNumber, int floor, BigDecimal sizePyeong,
						 String roomType, long monthlyRent, long deposit, String status,
						 String optionsCsv, String memo,
						 Instant createdAt, Instant updatedAt, Instant deletedAt) {
		this.id = id;
		this.roomNumber = roomNumber;
		this.floor = floor;
		this.sizePyeong = sizePyeong;
		this.roomType = roomType;
		this.monthlyRent = monthlyRent;
		this.deposit = deposit;
		this.status = status;
		this.optionsCsv = optionsCsv;
		this.memo = memo;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.deletedAt = deletedAt;
	}

	public UUID getId() { return id; }
	public String getRoomNumber() { return roomNumber; }
	public int getFloor() { return floor; }
	public BigDecimal getSizePyeong() { return sizePyeong; }
	public String getRoomType() { return roomType; }
	public long getMonthlyRent() { return monthlyRent; }
	public long getDeposit() { return deposit; }
	public String getStatus() { return status; }
	public String getOptionsCsv() { return optionsCsv; }
	public String getMemo() { return memo; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
	public Instant getDeletedAt() { return deletedAt; }
}
