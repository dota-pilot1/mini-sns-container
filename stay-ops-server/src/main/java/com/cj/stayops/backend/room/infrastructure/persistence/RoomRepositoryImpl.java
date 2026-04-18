package com.cj.stayops.backend.room.infrastructure.persistence;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import com.cj.stayops.backend.room.domain.model.Money;
import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomNumber;
import com.cj.stayops.backend.room.domain.model.RoomOption;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.model.RoomType;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;

/**
 * 도메인 {@link RoomRepository} 계약의 JPA 기반 구현체. 도메인 ↔ JPA 엔티티 매핑 담당.
 */
@Repository
public class RoomRepositoryImpl implements RoomRepository {

	private final RoomJpaRepository jpaRepository;

	public RoomRepositoryImpl(RoomJpaRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	public Room save(Room room) {
		RoomJpaEntity entity = toEntity(room);
		RoomJpaEntity saved = jpaRepository.save(entity);
		return toDomain(saved);
	}

	@Override
	public Optional<Room> findById(RoomId id) {
		return jpaRepository.findByIdAndDeletedAtIsNull(id.value()).map(this::toDomain);
	}

	@Override
	public Optional<Room> findByRoomNumber(RoomNumber roomNumber) {
		return jpaRepository.findByRoomNumberAndDeletedAtIsNull(roomNumber.value()).map(this::toDomain);
	}

	@Override
	public boolean existsByRoomNumber(RoomNumber roomNumber) {
		return jpaRepository.existsByRoomNumberAndDeletedAtIsNull(roomNumber.value());
	}

	@Override
	public List<Room> findAll(Integer floor, RoomStatus status, RoomType roomType) {
		return jpaRepository.findAllByFilters(
				floor,
				status == null ? null : status.name(),
				roomType == null ? null : roomType.name()
			).stream()
			.map(this::toDomain)
			.toList();
	}

	// ---------- mapping ----------

	private RoomJpaEntity toEntity(Room room) {
		return new RoomJpaEntity(
			room.id().value(),
			room.roomNumber().value(),
			room.floor(),
			room.sizePyeong(),
			room.roomType().name(),
			room.monthlyRent().amount(),
			room.deposit().amount(),
			room.status().name(),
			optionsToCsv(room.options()),
			room.memo(),
			room.createdAt(),
			room.updatedAt(),
			room.deletedAt()
		);
	}

	private Room toDomain(RoomJpaEntity e) {
		return Room.reconstitute(
			RoomId.of(e.getId()),
			RoomNumber.of(e.getRoomNumber()),
			e.getFloor(),
			e.getSizePyeong(),
			RoomType.valueOf(e.getRoomType()),
			Money.of(e.getMonthlyRent(), "monthlyRent"),
			Money.of(e.getDeposit(), "deposit"),
			RoomStatus.valueOf(e.getStatus()),
			optionsFromCsv(e.getOptionsCsv()),
			e.getMemo(),
			e.getCreatedAt(),
			e.getUpdatedAt(),
			e.getDeletedAt()
		);
	}

	private static String optionsToCsv(Set<RoomOption> options) {
		if (options == null || options.isEmpty()) {
			return null;
		}
		return options.stream().map(Enum::name).collect(Collectors.joining(","));
	}

	private static Set<RoomOption> optionsFromCsv(String csv) {
		if (csv == null || csv.isBlank()) {
			return EnumSet.noneOf(RoomOption.class);
		}
		return Arrays.stream(csv.split(","))
			.map(String::trim)
			.filter(s -> !s.isEmpty())
			.map(RoomOption::valueOf)
			.collect(Collectors.toCollection(() -> EnumSet.noneOf(RoomOption.class)));
	}
}
