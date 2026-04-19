package com.cj.stayops.backend.room.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA Repository (기술 세부사항).
 * <p>
 * 조회 메서드는 모두 {@code deleted_at IS NULL} 조건을 포함 (soft delete).
 */
public interface RoomJpaRepository extends JpaRepository<RoomJpaEntity, UUID> {

	Optional<RoomJpaEntity> findByIdAndDeletedAtIsNull(UUID id);

	Optional<RoomJpaEntity> findByRoomNumberAndDeletedAtIsNull(String roomNumber);

	boolean existsByRoomNumberAndDeletedAtIsNull(String roomNumber);

	/**
	 * 필터 조회. 각 파라미터가 null 이면 해당 조건은 무시.
	 */
	@Query("""
		SELECT r FROM RoomJpaEntity r
		WHERE r.deletedAt IS NULL
		  AND (:floor IS NULL OR r.floor = :floor)
		  AND (:status IS NULL OR r.status = :status)
		ORDER BY r.floor DESC, r.roomNumber ASC
		""")
	List<RoomJpaEntity> findAllByFilters(
		@Param("floor") Integer floor,
		@Param("status") String status
	);
}
