package com.cj.stayops.backend.config.aws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * AWS S3 SDK v2 의 {@link S3Client} / {@link S3Presigner} 빈 등록.
 * <p>
 * {@code aws.credentials.access-key} 등이 비어 있으면 AWS 의 기본 자격 증명 체인
 * ({@code ~/.aws/credentials}, env, IAM Role)으로 fallback 한다.
 */
@Configuration
@EnableConfigurationProperties(AwsS3Properties.class)
public class S3Config {

	private static final Logger log = LoggerFactory.getLogger(S3Config.class);

	private final AwsS3Properties props;

	public S3Config(AwsS3Properties props) {
		this.props = props;
		String region = props.region() == null ? "(none)" : props.region();
		String bucket = props.s3().bucket().isBlank() ? "(empty)" : props.s3().bucket();
		log.info("S3Config initialized. region={}, bucket={}, credsConfigured={}",
			region, bucket, props.credentials().isConfigured());
	}

	@Bean
	public S3Client s3Client() {
		return S3Client.builder()
			.region(resolveRegion())
			.credentialsProvider(resolveCredentialsProvider())
			.build();
	}

	@Bean
	public S3Presigner s3Presigner() {
		return S3Presigner.builder()
			.region(resolveRegion())
			.credentialsProvider(resolveCredentialsProvider())
			.build();
	}

	private Region resolveRegion() {
		return (props.region() == null || props.region().isBlank())
			? Region.AP_NORTHEAST_2
			: Region.of(props.region());
	}

	private software.amazon.awssdk.auth.credentials.AwsCredentialsProvider resolveCredentialsProvider() {
		if (props.credentials().isConfigured()) {
			return StaticCredentialsProvider.create(
				AwsBasicCredentials.create(
					props.credentials().accessKey(),
					props.credentials().secretKey()
				)
			);
		}
		log.warn("AWS credentials not set in aws.credentials.*. Falling back to default provider chain.");
		return DefaultCredentialsProvider.create();
	}
}
