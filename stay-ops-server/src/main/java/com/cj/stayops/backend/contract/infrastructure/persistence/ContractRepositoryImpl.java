package com.cj.stayops.backend.contract.infrastructure.persistence;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.repository.ContractRepository;

@Repository
public class ContractRepositoryImpl implements ContractRepository {

	private final ContractJpaRepository jpaRepository;

	public ContractRepositoryImpl(ContractJpaRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	public Contract save(Contract contract) {
		ContractJpaEntity saved = jpaRepository.save(toEntity(contract));
		return toDomain(saved);
	}

	@Override
	public Optional<Contract> findById(ContractId id) {
		return jpaRepository.findByIdActive(id.value()).map(this::toDomain);
	}

	@Override
	public List<Contract> findAll(UUID tenantId, UUID roomId) {
		return jpaRepository.findAllByFilters(tenantId, roomId).stream()
			.map(this::toDomain)
			.toList();
	}

	@Override
	public List<Contract> findEffective(LocalDate asOf, UUID tenantId, UUID roomId) {
		return jpaRepository.findEffective(asOf, tenantId, roomId).stream()
			.map(this::toDomain)
			.toList();
	}

	@Override
	public void deleteByTenantId(UUID tenantId) {
		jpaRepository.deleteByTenantId(tenantId);
	}

	private ContractJpaEntity toEntity(Contract c) {
		return new ContractJpaEntity(
			c.id().value(),
			c.tenantId(),
			c.roomId(),
			c.startDate(),
			c.endDate(),
			c.monthlyRent(),
			c.deposit(),
			c.previousContractId() == null ? null : c.previousContractId().value(),
			c.deletedAt(),
			c.createdAt(),
			c.updatedAt()
		);
	}

	private Contract toDomain(ContractJpaEntity e) {
		return Contract.reconstitute(
			ContractId.of(e.getId()),
			e.getTenantId(),
			e.getRoomId(),
			e.getStartDate(),
			e.getEndDate(),
			e.getMonthlyRent(),
			e.getDeposit(),
			e.getPreviousContractId() == null ? null : ContractId.of(e.getPreviousContractId()),
			e.getDeletedAt(),
			e.getCreatedAt(),
			e.getUpdatedAt()
		);
	}
}
