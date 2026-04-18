package com.cj.stayops.backend.tenant.domain.model;

import java.util.regex.Pattern;

import com.cj.stayops.backend.tenant.domain.exception.InvalidTenantFieldException;

/**
 * 휴대전화 번호 Value Object. 한국 형식만 허용 (010-xxxx-xxxx / 01012345678).
 * <p>
 * 저장 시 하이픈 제거 후 숫자만 보관하며, 표시는 01X-XXXX-XXXX 형태로 포맷한다.
 */
public final class PhoneNumber {

	private static final Pattern DIGITS_ONLY = Pattern.compile("^01[016789]\\d{7,8}$");

	private final String digits;

	private PhoneNumber(String digits) {
		this.digits = digits;
	}

	public static PhoneNumber of(String raw) {
		if (raw == null || raw.isBlank()) {
			throw new InvalidTenantFieldException("phoneNumber", "연락처는 비어 있을 수 없습니다.");
		}
		String normalized = raw.replaceAll("[\\s-]", "");
		if (!DIGITS_ONLY.matcher(normalized).matches()) {
			throw new InvalidTenantFieldException("phoneNumber",
				"연락처는 01X-XXXX-XXXX 형식이어야 합니다: " + raw);
		}
		return new PhoneNumber(normalized);
	}

	/** 저장용 — 숫자만 (하이픈 없음). */
	public String digits() {
		return digits;
	}

	/** 표시용 — 01X-XXXX-XXXX. */
	public String formatted() {
		int len = digits.length();
		if (len == 11) {
			return digits.substring(0, 3) + "-" + digits.substring(3, 7) + "-" + digits.substring(7);
		}
		// 10자리 (01X-XXX-XXXX)
		return digits.substring(0, 3) + "-" + digits.substring(3, 6) + "-" + digits.substring(6);
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof PhoneNumber other)) return false;
		return digits.equals(other.digits);
	}

	@Override
	public int hashCode() {
		return digits.hashCode();
	}

	@Override
	public String toString() {
		return formatted();
	}
}
