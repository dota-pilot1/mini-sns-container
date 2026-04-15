package com.cj.stayops.backend.user.domain.model;

import java.time.Instant;
import java.util.Objects;

/**
 * User Aggregate Root.
 * <p>
 * - 식별: {@link UserId}
 * - 불변식: email은 항상 유효한 형식, passwordHash는 항상 존재(이미 해시된 값)
 * - 생성은 정적 팩토리 {@link #register(UserId, Email, String, String, Instant)}로만 허용
 * - 도메인 계층은 해싱 알고리즘을 알지 않는다 → 해시된 값만 받는다
 */
public class User {

	private final UserId id;
	private final Email email;
	private final String passwordHash;
	private final String name;
	private final Instant createdAt;
	private final Instant updatedAt;

	private User(UserId id, Email email, String passwordHash, String name,
				 Instant createdAt, Instant updatedAt) {
		this.id = Objects.requireNonNull(id, "id");
		this.email = Objects.requireNonNull(email, "email");
		this.passwordHash = Objects.requireNonNull(passwordHash, "passwordHash");
		this.name = Objects.requireNonNull(name, "name");
		this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
		this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt");
	}

	/**
	 * 신규 사용자 등록용 팩토리.
	 * passwordHash는 Application Layer에서 PasswordEncoder로 이미 해시된 값이어야 한다.
	 */
	public static User register(UserId id, Email email, String passwordHash, String name, Instant now) {
		if (passwordHash == null || passwordHash.isBlank()) {
			throw new IllegalArgumentException("passwordHash must not be blank");
		}
		if (name == null || name.isBlank()) {
			throw new IllegalArgumentException("name must not be blank");
		}
		return new User(id, email, passwordHash, name.trim(), now, now);
	}

	/**
	 * Infrastructure Layer에서 영속 데이터를 도메인으로 복원할 때 사용.
	 */
	public static User reconstitute(UserId id, Email email, String passwordHash, String name,
									Instant createdAt, Instant updatedAt) {
		return new User(id, email, passwordHash, name, createdAt, updatedAt);
	}

	public UserId id() { return id; }
	public Email email() { return email; }
	public String passwordHash() { return passwordHash; }
	public String name() { return name; }
	public Instant createdAt() { return createdAt; }
	public Instant updatedAt() { return updatedAt; }

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (!(o instanceof User other)) return false;
		return id.equals(other.id);
	}

	@Override
	public int hashCode() {
		return id.hashCode();
	}
}
