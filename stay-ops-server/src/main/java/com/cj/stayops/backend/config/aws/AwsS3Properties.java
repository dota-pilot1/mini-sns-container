package com.cj.stayops.backend.config.aws;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * AWS S3 관련 설정. application.yaml 의 {@code aws} 블록과 바인딩된다.
 * <p>
 * region/creds/bucket 이 비어 있어도 애플리케이션은 기동된다 (테스트·로컬 편의).
 * 실제 S3 호출 시점에 AWS SDK 가 명시적인 에러를 던진다.
 */
@ConfigurationProperties(prefix = "aws")
public record AwsS3Properties(
	String region,
	Credentials credentials,
	S3 s3
) {

	public AwsS3Properties {
		if (credentials == null) credentials = new Credentials("", "");
		if (s3 == null) s3 = new S3("", 600, 10_485_760);
	}

	public record Credentials(String accessKey, String secretKey) {
		/** access/secret 중 하나라도 비어 있으면 false. */
		public boolean isConfigured() {
			return accessKey != null && !accessKey.isBlank()
				&& secretKey != null && !secretKey.isBlank();
		}
	}

	public record S3(
		String bucket,
		int presignTtlSeconds,
		long maxUploadBytes
	) {}
}
