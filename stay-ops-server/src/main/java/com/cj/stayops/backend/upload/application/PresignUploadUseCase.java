package com.cj.stayops.backend.upload.application;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.cj.stayops.backend.config.aws.AwsS3Properties;
import com.cj.stayops.backend.room.domain.exception.RoomNotFoundException;
import com.cj.stayops.backend.room.domain.model.RoomId;
import com.cj.stayops.backend.room.domain.repository.RoomRepository;
import com.cj.stayops.backend.upload.application.dto.PresignCommand;
import com.cj.stayops.backend.upload.application.dto.PresignResult;
import com.cj.stayops.backend.upload.domain.exception.InvalidUploadRequestException;

import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

/**
 * S3 에 직접 PUT 할 수 있는 presigned URL 을 발급한다.
 * 업로드 바이트는 서버를 거치지 않는다.
 */
@Service
public class PresignUploadUseCase {

	private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
		"image/jpeg", "image/png", "image/webp", "image/gif"
	);
	private static final Set<String> ALLOWED_SCOPES = Set.of("room");
	private static final DateTimeFormatter DATE_PATH = DateTimeFormatter.ofPattern("yyyy/MM/dd");

	private final S3Presigner presigner;
	private final AwsS3Properties props;
	private final RoomRepository roomRepository;
	private final Clock clock;

	public PresignUploadUseCase(S3Presigner presigner, AwsS3Properties props,
								RoomRepository roomRepository, Clock clock) {
		this.presigner = presigner;
		this.props = props;
		this.roomRepository = roomRepository;
		this.clock = clock;
	}

	public PresignResult execute(PresignCommand cmd) {
		validate(cmd);
		ensureRefExists(cmd);

		String key = buildKey(cmd);
		int ttl = props.s3().presignTtlSeconds();

		PutObjectRequest put = PutObjectRequest.builder()
			.bucket(props.s3().bucket())
			.key(key)
			.contentType(cmd.contentType())
			.contentLength(cmd.sizeBytes())
			.build();

		PresignedPutObjectRequest presigned = presigner.presignPutObject(
			PutObjectPresignRequest.builder()
				.signatureDuration(Duration.ofSeconds(ttl))
				.putObjectRequest(put)
				.build()
		);

		return new PresignResult(key, presigned.url().toString(), ttl);
	}

	private void validate(PresignCommand cmd) {
		if (cmd.scope() == null || !ALLOWED_SCOPES.contains(cmd.scope())) {
			throw new InvalidUploadRequestException("scope",
				"지원하지 않는 scope 입니다: " + cmd.scope());
		}
		if (cmd.refId() == null || cmd.refId().isBlank()) {
			throw new InvalidUploadRequestException("refId", "refId 는 필수입니다.");
		}
		if (cmd.filename() == null || cmd.filename().isBlank()) {
			throw new InvalidUploadRequestException("filename", "파일명은 필수입니다.");
		}
		if (cmd.contentType() == null || !ALLOWED_CONTENT_TYPES.contains(cmd.contentType())) {
			throw new InvalidUploadRequestException("contentType",
				"허용되지 않는 contentType 입니다. 허용: " + ALLOWED_CONTENT_TYPES);
		}
		long max = props.s3().maxUploadBytes();
		if (cmd.sizeBytes() <= 0 || cmd.sizeBytes() > max) {
			throw new InvalidUploadRequestException("sizeBytes",
				"파일 크기가 허용 범위를 벗어났습니다. max=" + max + " bytes");
		}
		if (props.s3().bucket() == null || props.s3().bucket().isBlank()) {
			throw new IllegalStateException("S3 bucket 설정이 비어있습니다. aws.s3.bucket 확인.");
		}
	}

	private void ensureRefExists(PresignCommand cmd) {
		if ("room".equals(cmd.scope())) {
			RoomId roomId;
			try {
				roomId = RoomId.of(cmd.refId());
			} catch (IllegalArgumentException e) {
				throw new InvalidUploadRequestException("refId", "refId 형식이 올바르지 않습니다.");
			}
			if (roomRepository.findById(roomId).isEmpty()) {
				throw new RoomNotFoundException(cmd.refId());
			}
		}
	}

	private String buildKey(PresignCommand cmd) {
		String datePath = LocalDate.ofInstant(Instant.now(clock), ZoneId.systemDefault()).format(DATE_PATH);
		String safe = sanitizeFilename(cmd.filename());
		return String.format("%ss/%s/%s/%s-%s", cmd.scope(), cmd.refId(), datePath, UUID.randomUUID(), safe);
	}

	static String sanitizeFilename(String filename) {
		// 경로 분리자 제거 + 알파벳/숫자/.-_ 외 모두 언더스코어.
		String base = filename.replaceAll("[\\\\/]+", "_");
		String cleaned = base.replaceAll("[^a-zA-Z0-9._-]", "_");
		// 선두/말미 점·공백 방어.
		cleaned = cleaned.replaceAll("^[.\\s]+", "").replaceAll("[.\\s]+$", "");
		if (cleaned.isBlank()) cleaned = "file";
		if (cleaned.length() > 120) cleaned = cleaned.substring(cleaned.length() - 120);
		return cleaned;
	}
}
