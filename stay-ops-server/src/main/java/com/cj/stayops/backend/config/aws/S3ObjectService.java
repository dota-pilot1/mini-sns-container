package com.cj.stayops.backend.config.aws;

import java.time.Duration;

import org.springframework.stereotype.Service;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

/**
 * S3 객체에 대한 공통 조작 (HEAD, DELETE, presigned GET).
 * 버킷/region 은 {@link AwsS3Properties} 에서 주입.
 */
@Service
public class S3ObjectService {

	private final S3Client s3Client;
	private final S3Presigner presigner;
	private final AwsS3Properties props;

	public S3ObjectService(S3Client s3Client, S3Presigner presigner, AwsS3Properties props) {
		this.s3Client = s3Client;
		this.presigner = presigner;
		this.props = props;
	}

	/** 객체가 존재하면 메타데이터 반환, 없으면 빈 Optional. */
	public java.util.Optional<HeadObjectResponse> head(String key) {
		try {
			HeadObjectResponse response = s3Client.headObject(HeadObjectRequest.builder()
				.bucket(props.s3().bucket())
				.key(key)
				.build());
			return java.util.Optional.of(response);
		} catch (NoSuchKeyException e) {
			return java.util.Optional.empty();
		}
	}

	/** DB 에서 이미지를 지운 뒤 S3 에서도 제거. S3 실패는 로그만 남기고 삼킴 (orphan 은 별도 배치). */
	public void delete(String key) {
		s3Client.deleteObject(DeleteObjectRequest.builder()
			.bucket(props.s3().bucket())
			.key(key)
			.build());
	}

	/** 조회용 presigned GET URL. TTL 은 s3.presign-ttl-seconds 를 재사용. */
	public String presignGetUrl(String key) {
		GetObjectRequest get = GetObjectRequest.builder()
			.bucket(props.s3().bucket())
			.key(key)
			.build();
		return presigner.presignGetObject(GetObjectPresignRequest.builder()
			.signatureDuration(Duration.ofSeconds(props.s3().presignTtlSeconds()))
			.getObjectRequest(get)
			.build()
		).url().toString();
	}
}
