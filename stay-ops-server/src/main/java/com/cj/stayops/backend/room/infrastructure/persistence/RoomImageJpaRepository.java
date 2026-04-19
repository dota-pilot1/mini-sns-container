package com.cj.stayops.backend.room.infrastructure.persistence;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomImageJpaRepository extends JpaRepository<RoomImageJpaEntity, UUID> {

	List<RoomImageJpaEntity> findAllByRoomIdOrderBySortOrderAscCreatedAtAsc(UUID roomId);

	Optional<RoomImageJpaEntity> findFirstByRoomIdAndPrimaryTrue(UUID roomId);

	@Query("""
		SELECT i FROM RoomImageJpaEntity i
		WHERE i.roomId IN :roomIds AND i.primary = true
		""")
	List<RoomImageJpaEntity> findPrimaryByRoomIds(@Param("roomIds") Collection<UUID> roomIds);

	long countByRoomId(UUID roomId);

	@Query("SELECT COALESCE(MAX(i.sortOrder), -1) FROM RoomImageJpaEntity i WHERE i.roomId = :roomId")
	int maxSortOrderByRoomId(@Param("roomId") UUID roomId);
}
