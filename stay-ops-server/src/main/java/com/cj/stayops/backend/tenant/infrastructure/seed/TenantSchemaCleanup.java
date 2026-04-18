package com.cj.stayops.backend.tenant.infrastructure.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Contract 도메인 도입 (Phase 2) 전환용 1회성 스키마 정리.
 * <p>
 * Hibernate ddl-auto=update 는 컬럼을 추가만 하고 제거하지 않는다. 이 컴포넌트는
 * 기존 {@code tenants} 테이블에 남아있는 구 스키마 컬럼을 드롭하고,
 * 데이터 모델이 바뀐 이상 기존 Tenant 행들도 한 번 비워서 시더가 새 구조로 재삽입하게 한다.
 * <p>
 * 운영 환경에서는 마이그레이션(Flyway 등)으로 대체되어야 한다. 현재는 dev 한정이며
 * 멱등(idempotent): 이미 정리된 스키마에서 재실행되어도 오류 없이 스킵.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TenantSchemaCleanup implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(TenantSchemaCleanup.class);

	private final JdbcTemplate jdbcTemplate;

	public TenantSchemaCleanup(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@Override
	public void run(org.springframework.boot.ApplicationArguments args) {
		boolean hasLegacyColumn = countColumn("tenants", "status") > 0
			|| countColumn("tenants", "room_id") > 0
			|| countColumn("tenants", "move_in_date") > 0
			|| countColumn("tenants", "move_out_date") > 0
			|| countColumn("tenants", "deleted_at") > 0;

		if (!hasLegacyColumn) {
			return;
		}

		log.warn("[TenantSchemaCleanup] 구 스키마 감지 — tenants 비우고 컬럼 제거 시작");

		// 자식 제약이 없으니 단순 DELETE → 시더가 이후 재삽입.
		jdbcTemplate.update("DELETE FROM tenants");

		jdbcTemplate.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS status");
		jdbcTemplate.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS room_id");
		jdbcTemplate.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS move_in_date");
		jdbcTemplate.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS move_out_date");
		jdbcTemplate.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS deleted_at");

		log.info("[TenantSchemaCleanup] 구 스키마 정리 완료");
	}

	private int countColumn(String table, String column) {
		Integer count = jdbcTemplate.queryForObject(
			"""
			SELECT COUNT(*) FROM information_schema.columns
			WHERE table_schema = 'public' AND table_name = ? AND column_name = ?
			""",
			Integer.class, table, column
		);
		return count == null ? 0 : count;
	}
}
