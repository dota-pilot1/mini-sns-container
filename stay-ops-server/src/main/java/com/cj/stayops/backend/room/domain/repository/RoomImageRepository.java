package com.cj.stayops.backend.room.domain.repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.model.RoomImage;
import com.cj.stayops.backend.room.domain.model.RoomImageId;

public interface RoomImageRepository {

	RoomImage save(RoomImage image);

	/** 여러 이미지를 한 번에 저장 (대표 변경 시 여러 행 UPDATE). */
	void saveAll(Collection<RoomImage> images);

	Optional<RoomImage> findById(RoomImageId id);

	/** sortOrder ASC, createdAt ASC 순서. */
	List<RoomImage> findAllByRoomId(RoomId roomId);

	Optional<RoomImage> findPrimaryByRoomId(RoomId roomId);

	/** 여러 Room 에 대해 대표 이미지를 한 번에 조회 — 목록 썸네일 용. */
	Map<RoomId, RoomImage> findPrimaryByRoomIds(Collection<RoomId> roomIds);

	/** 해당 Room 에 등록된 이미지 개수. */
	long countByRoomId(RoomId roomId);

	int maxSortOrderByRoomId(RoomId roomId);

	void delete(RoomImage image);
}
