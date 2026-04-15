package com.cj.stayops.backend.user.domain.model;

import java.util.regex.Pattern;

import com.cj.stayops.backend.user.domain.exception.InvalidEmailException;

/**
 * Email Value Object.
 * <p>
 * 생성 시점에 형식 검증을 수행하여, 도메인 내부에서는 항상 유효한 Email만
 * 존재한다는 것을 보장한다 (Always-Valid 패턴).
 */
public final class Email {

	/**
	 * 실무 수준의 이메일 정규식.
	 * RFC 5322 완전 구현은 아니지만, 대부분의 실제 이메일을 커버한다.
	 */
	private static final Pattern EMAIL_PATTERN = Pattern.compile(
		"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
	);

	private static final int MAX_LENGTH = 254; // RFC 5321

	private final String value;

	private Email(String value) {
		this.value = value;
	}

	public static Email of(String raw) {
		if (raw == null || raw.isBlank()) {
			throw new InvalidEmailException("Email must not be blank");
		}
		String normalized = raw.trim().toLowerCase();
		if (normalized.length() > MAX_LENGTH) {
			throw new InvalidEmailException("Email exceeds max length: " + MAX_LENGTH);
		}
		if (!EMAIL_PATTERN.matcher(normalized).matches()) {
			throw new InvalidEmailException("Invalid email format: " + raw);
		}
		return new Email(normalized);
	}

	public String value() {
		return value;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof Email other)) return false;
		return value.equals(other.value);
	}

	@Override
	public int hashCode() {
		return value.hashCode();
	}

	@Override
	public String toString() {
		return value;
	}
}
