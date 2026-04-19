package com.cj.stayops.backend.upload.domain.exception;

/** presign 요청 파라미터 검증 실패. → 400 Bad Request. */
public class InvalidUploadRequestException extends RuntimeException {

	private final String field;

	public InvalidUploadRequestException(String field, String message) {
		super(message);
		this.field = field;
	}

	public String field() { return field; }
}
