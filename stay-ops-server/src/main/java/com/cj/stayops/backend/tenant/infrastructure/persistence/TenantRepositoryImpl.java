package com.cj.stayops.backend.tenant.infrastructure.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.cj.stayops.backend.tenant.domain.model.PhoneNumber;
import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;
import com.cj.stayops.backend.tenant.domain.repository.TenantRepository;

@Repository
public class TenantRepositoryImpl implements TenantRepository {

	private final TenantJpaRepository jpaRepository;

	public TenantRepositoryImpl(TenantJpaRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	public Tenant save(Tenant tenant) {
		TenantJpaEntity saved = jpaRepository.save(toEntity(tenant));
		return toDomain(saved);
	}

	@Override
	public Optional<Tenant> findById(TenantId id) {
		return jpaRepository.findById(id.value()).map(this::toDomain);
	}

	@Override
	public List<Tenant> findAll() {
		return jpaRepository.findAllOrdered().stream().map(this::toDomain).toList();
	}

	@Override
	public void deleteById(TenantId id) {
		jpaRepository.deleteById(id.value());
	}

	private TenantJpaEntity toEntity(Tenant t) {
		return new TenantJpaEntity(
			t.id().value(),
			t.userId(),
			t.name(),
			t.phoneNumber().digits(),
			t.memo(),
			t.createdAt(),
			t.updatedAt()
		);
	}

	private Tenant toDomain(TenantJpaEntity e) {
		return Tenant.reconstitute(
			TenantId.of(e.getId()),
			e.getUserId(),
			e.getName(),
			PhoneNumber.of(e.getPhoneDigits()),
			e.getMemo(),
			e.getCreatedAt(),
			e.getUpdatedAt()
		);
	}
}
