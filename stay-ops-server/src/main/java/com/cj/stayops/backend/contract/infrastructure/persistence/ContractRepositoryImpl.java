package com.cj.stayops.backend.contract.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.cj.stayops.backend.contract.domain.model.Contract;
import com.cj.stayops.backend.contract.domain.model.ContractId;
import com.cj.stayops.backend.contract.domain.model.ContractStatus;
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
		return jpaRepository.findById(id.value()).map(this::toDomain);
	}

	@Override
	public List<Contract> findAll(UUID tenantId, UUID roomId, ContractStatus status) {
		return jpaRepository.findAllByFilters(
				tenantId, roomId,
				status == null ? null : status.name()
			).stream()
			.map(this::toDomain)
			.toList();
	}

	@Override
	public void deleteByTenantId(UUID tenantId) {
		jpaRepository.deleteByTenantId(tenantId);
	}

	@Override
	public void deleteById(ContractId id) {
		jpaRepository.deleteById(id.value());
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
			c.status().name(),
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
			ContractStatus.valueOf(e.getStatus()),
			e.getCreatedAt(),
			e.getUpdatedAt()
		);
	}
}
