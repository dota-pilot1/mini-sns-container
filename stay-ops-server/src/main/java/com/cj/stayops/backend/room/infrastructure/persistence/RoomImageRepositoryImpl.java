package com.cj.stayops.backend.room.infrastructure.persistence;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomImage;
import com.cj.stayops.backend.room.domain.model.RoomImageId;
import com.cj.stayops.backend.room.domain.repository.RoomImageRepository;

@Repository
public class RoomImageRepositoryImpl implements RoomImageRepository {

	private final RoomImageJpaRepository jpaRepository;

	public RoomImageRepositoryImpl(RoomImageJpaRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	public RoomImage save(RoomImage image) {
		return toDomain(jpaRepository.save(toEntity(image)));
	}

	@Override
	public void saveAll(Collection<RoomImage> images) {
		List<RoomImageJpaEntity> entities = images.stream().map(this::toEntity).toList();
		jpaRepository.saveAll(entities);
	}

	@Override
	public Optional<RoomImage> findById(RoomImageId id) {
		return jpaRepository.findById(id.value()).map(this::toDomain);
	}

	@Override
	public List<RoomImage> findAllByRoomId(RoomId roomId) {
		return jpaRepository.findAllByRoomIdOrderBySortOrderAscCreatedAtAsc(roomId.value()).stream()
			.map(this::toDomain)
			.toList();
	}

	@Override
	public Optional<RoomImage> findPrimaryByRoomId(RoomId roomId) {
		return jpaRepository.findFirstByRoomIdAndPrimaryTrue(roomId.value()).map(this::toDomain);
	}

	@Override
	public Map<RoomId, RoomImage> findPrimaryByRoomIds(Collection<RoomId> roomIds) {
		if (roomIds == null || roomIds.isEmpty()) return Map.of();
		List<RoomImageJpaEntity> rows = jpaRepository.findPrimaryByRoomIds(
			roomIds.stream().map(RoomId::value).collect(Collectors.toSet())
		);
		Map<RoomId, RoomImage> result = new HashMap<>();
		for (RoomImageJpaEntity e : rows) {
			result.put(RoomId.of(e.getRoomId()), toDomain(e));
		}
		return result;
	}

	@Override
	public long countByRoomId(RoomId roomId) {
		return jpaRepository.countByRoomId(roomId.value());
	}

	@Override
	public int maxSortOrderByRoomId(RoomId roomId) {
		return jpaRepository.maxSortOrderByRoomId(roomId.value());
	}

	@Override
	public void delete(RoomImage image) {
		jpaRepository.deleteById(image.id().value());
	}

	// ---------- mapping ----------

	private RoomImageJpaEntity toEntity(RoomImage image) {
		return new RoomImageJpaEntity(
			image.id().value(),
			image.roomId().value(),
			image.s3Key(),
			image.contentType(),
			image.sizeBytes(),
			image.sortOrder(),
			image.isPrimary(),
			image.createdAt()
		);
	}

	private RoomImage toDomain(RoomImageJpaEntity e) {
		return RoomImage.reconstitute(
			RoomImageId.of(e.getId()),
			RoomId.of(e.getRoomId()),
			e.getS3Key(),
			e.getContentType(),
			e.getSizeBytes(),
			e.getSortOrder(),
			e.isPrimary(),
			e.getCreatedAt()
		);
	}
}
