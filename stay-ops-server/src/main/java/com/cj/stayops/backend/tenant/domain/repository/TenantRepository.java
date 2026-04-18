package com.cj.stayops.backend.tenant.domain.repository;

import java.util.List;
import java.util.Optional;

import com.cj.stayops.backend.tenant.domain.model.Tenant;
import com.cj.stayops.backend.tenant.domain.model.TenantId;

public interface TenantRepository {

	Tenant save(Tenant tenant);

	Optional<Tenant> findById(TenantId id);

	List<Tenant> findAll();

	void deleteById(TenantId id);
}
