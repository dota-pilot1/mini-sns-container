package com.cj.stayops.backend.contract.infrastructure.persistence;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "contracts", indexes = {
	@Index(name = "idx_contracts_tenant", columnList = "tenant_id"),
	@Index(name = "idx_contracts_room", columnList = "room_id"),
	@Index(name = "idx_contracts_status", columnList = "status"),
	@Index(name = "idx_contracts_previous", columnList = "previous_contract_id"),
	@Index(name = "idx_contracts_deleted_at", columnList = "deleted_at")
})
public class ContractJpaEntity {

	@Id
	@Column(columnDefinition = "uuid")
	private UUID id;

	@Column(name = "tenant_id", nullable = false, columnDefinition = "uuid")
	private UUID tenantId;

	@Column(name = "room_id", nullable = false, columnDefinition = "uuid")
	private UUID roomId;

	@Column(name = "start_date", nullable = false)
	private LocalDate startDate;

	@Column(name = "end_date", nullable = false)
	private LocalDate endDate;

	@Column(name = "monthly_rent", nullable = false)
	private long monthlyRent;

	@Column(nullable = false)
	private long deposit;

	@Column(nullable = false, length = 20)
	private String status;

	@Column(name = "previous_contract_id", columnDefinition = "uuid")
	private UUID previousContractId;

	@Column(name = "deleted_at")
	private Instant deletedAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected ContractJpaEntity() { }

	public ContractJpaEntity(UUID id, UUID tenantId, UUID roomId,
							 LocalDate startDate, LocalDate endDate,
							 long monthlyRent, long deposit, String status,
							 UUID previousContractId,
							 Instant deletedAt,
							 Instant createdAt, Instant updatedAt) {
		this.id = id;
		this.tenantId = tenantId;
		this.roomId = roomId;
		this.startDate = startDate;
		this.endDate = endDate;
		this.monthlyRent = monthlyRent;
		this.deposit = deposit;
		this.status = status;
		this.previousContractId = previousContractId;
		this.deletedAt = deletedAt;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	public UUID getId() { return id; }
	public UUID getTenantId() { return tenantId; }
	public UUID getRoomId() { return roomId; }
	public LocalDate getStartDate() { return startDate; }
	public LocalDate getEndDate() { return endDate; }
	public long getMonthlyRent() { return monthlyRent; }
	public long getDeposit() { return deposit; }
	public String getStatus() { return status; }
	public UUID getPreviousContractId() { return previousContractId; }
	public Instant getDeletedAt() { return deletedAt; }
	public Instant getCreatedAt() { return createdAt; }
	public Instant getUpdatedAt() { return updatedAt; }
}
