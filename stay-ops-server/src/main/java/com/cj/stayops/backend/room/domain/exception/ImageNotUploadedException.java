package com.cj.stayops.backend.room.domain.exception;

/** presign 으로 발급한 key 가 S3 에 아직 존재하지 않을 때. → 409 Conflict. */
public class ImageNotUploadedException extends RuntimeException {
	public ImageNotUploadedException(String s3Key) {
		super("S3 에 업로드된 객체가 없습니다: " + s3Key);
	}
}
