package com.cj.stayops.backend.tenant.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.cj.stayops.backend.tenant.domain.model.PhoneNumber;
import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.model.TenantStatus;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

/**
 * 도메인 {@link TenantRepository} 계약의 JPA 기반 구현체. 도메인 ↔ JPA 엔티티 매핑 담당.
 */
@Repository
public class TenantRepositoryImpl implements TenantRepository {

	private final TenantJpaRepository jpaRepository;

	public TenantRepositoryImpl(TenantJpaRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	public Tenant save(Tenant tenant) {
		TenantJpaEntity entity = toEntity(tenant);
		TenantJpaEntity saved = jpaRepository.save(entity);
		return toDomain(saved);
	}

	@Override
	public Optional<Tenant> findById(TenantId id) {
		return jpaRepository.findByIdAndDeletedAtIsNull(id.value()).map(this::toDomain);
	}

	@Override
	public Optional<Tenant> findByIdIncludingDeleted(TenantId id) {
		return jpaRepository.findById(id.value()).map(this::toDomain);
	}

	@Override
	public List<Tenant> findAll(TenantStatus status, UUID roomId) {
		return jpaRepository.findAllByFilters(
				status == null ? null : status.name(),
				roomId
			).stream()
			.map(this::toDomain)
			.toList();
	}

	@Override
	public List<Tenant> findAllDeleted() {
		return jpaRepository.findAllDeleted().stream()
			.map(this::toDomain)
			.toList();
	}

	@Override
	public void hardDelete(TenantId id) {
		jpaRepository.deleteById(id.value());
	}

	// ---------- mapping ----------

	private TenantJpaEntity toEntity(Tenant tenant) {
		return new TenantJpaEntity(
			tenant.id().value(),
			tenant.name(),
			tenant.phoneNumber().digits(),
			tenant.roomId(),
			tenant.status().name(),
			tenant.moveInDate(),
			tenant.moveOutDate(),
			tenant.memo(),
			tenant.createdAt(),
			tenant.updatedAt(),
			tenant.deletedAt()
		);
	}

	private Tenant toDomain(TenantJpaEntity e) {
		return Tenant.reconstitute(
			TenantId.of(e.getId()),
			e.getName(),
			PhoneNumber.of(e.getPhoneDigits()),
			e.getRoomId(),
			TenantStatus.valueOf(e.getStatus()),
			e.getMoveInDate(),
			e.getMoveOutDate(),
			e.getMemo(),
			e.getCreatedAt(),
			e.getUpdatedAt(),
			e.getDeletedAt()
		);
	}
}
