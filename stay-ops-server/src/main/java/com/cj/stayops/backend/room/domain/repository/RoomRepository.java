package com.cj.stayops.backend.room.domain.repository;

import java.util.List;
import java.util.Optional;

import com.cj.stayops.backend.room.domain.model.Room;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomNumber;
import com.cj.stayops.backend.room.domain.model.RoomStatus;
import com.cj.stayops.backend.room.domain.model.RoomType;

/**
 * Room Aggregate Repository (도메인 계약).
 * <p>
 * 구현체는 Infrastructure Layer(JPA)에 위치한다.
 * 소프트 삭제된 방은 조회 결과에서 제외된다 (구현체 책임).
 */
public interface RoomRepository {

	Room save(Room room);

	Optional<Room> findById(RoomId id);

	Optional<Room> findByRoomNumber(RoomNumber roomNumber);

	boolean existsByRoomNumber(RoomNumber roomNumber);

	/**
	 * 필터 조건에 맞는 방 목록을 createdAt 오름차순으로 반환. 필터는 모두 nullable (null = 필터링 안 함).
	 */
	List<Room> findAll(Integer floor, RoomStatus status, RoomType roomType);
}
