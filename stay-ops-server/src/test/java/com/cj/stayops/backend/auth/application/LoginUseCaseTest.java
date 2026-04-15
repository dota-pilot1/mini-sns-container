package com.cj.stayops.backend.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.cj.stayops.backend.auth.application.dto.LoginCommand;
import com.cj.stayops.backend.auth.application.dto.LoginResult;
import com.cj.stayops.backend.auth.domain.exception.InvalidCredentialsException;
import com.cj.stayops.backend.auth.infrastructure.security.JwtProperties;
import com.cj.stayops.backend.auth.infrastructure.security.JwtTokenProvider;
import com.cj.stayops.backend.user.domain.model.Email;
import com.cj.stayops.backend.user.domain.model.User;
import com.cj.stayops.backend.user.domain.model.UserId;
import com.cj.stayops.backend.user.domain.repository.UserRepository;

import io.jsonwebtoken.Claims;

class LoginUseCaseTest {

	private static final String SECRET =
		"test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
	private static final long TTL = 1800L;
	private static final String ISSUER = "stay-ops-test";
	private static final Instant FIXED_NOW = Instant.parse("2026-04-16T10:00:00Z");

	private InMemoryUserRepository userRepository;
	private PasswordEncoder passwordEncoder;
	private JwtTokenProvider jwtTokenProvider;
	private JwtProperties jwtProperties;
	private Clock clock;
	private LoginUseCase loginUseCase;

	@BeforeEach
	void setUp() {
		userRepository = new InMemoryUserRepository();
		passwordEncoder = new BCryptPasswordEncoder();
		jwtProperties = new JwtProperties(SECRET, TTL, ISSUER);
		clock = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
		jwtTokenProvider = new JwtTokenProvider(jwtProperties, clock);
		loginUseCase = new LoginUseCase(
			userRepository, passwordEncoder, jwtTokenProvider, jwtProperties, clock
		);
	}

	@Test
	@DisplayName("이메일/비밀번호 일치 → 토큰 발급 + LoginResult 반환")
	void success_returns_token_and_result() {
		// given: 가입된 사용자
		String rawPassword = "password1";
		User user = User.register(
			UserId.generate(),
			Email.of("user@example.com"),
			passwordEncoder.encode(rawPassword),
			"Alice",
			FIXED_NOW
		);
		userRepository.save(user);

		// when
		LoginResult result = loginUseCase.execute(
			new LoginCommand("user@example.com", rawPassword)
		);

		// then: 응답 필드
		assertThat(result.tokenType()).isEqualTo("Bearer");
		assertThat(result.expiresIn()).isEqualTo(TTL);
		assertThat(result.userId()).isEqualTo(user.id().asString());
		assertThat(result.email()).isEqualTo("user@example.com");
		assertThat(result.name()).isEqualTo("Alice");
		assertThat(result.accessToken()).isNotBlank();

		// then: 발급된 토큰이 자기 프로바이더로 검증 가능 + sub/email 일치
		Claims claims = jwtTokenProvider.verify(result.accessToken());
		assertThat(claims.getSubject()).isEqualTo(user.id().asString());
		assertThat(claims.get("email", String.class)).isEqualTo("user@example.com");
	}

	@Test
	@DisplayName("비밀번호 불일치 → InvalidCredentialsException")
	void wrong_password_throws() {
		User user = User.register(
			UserId.generate(),
			Email.of("user@example.com"),
			passwordEncoder.encode("password1"),
			"Alice",
			FIXED_NOW
		);
		userRepository.save(user);

		assertThatThrownBy(() -> loginUseCase.execute(
			new LoginCommand("user@example.com", "wrong-password-9")
		)).isInstanceOf(InvalidCredentialsException.class);
	}

	@Test
	@DisplayName("존재하지 않는 이메일 → InvalidCredentialsException (비번 불일치와 동일 예외)")
	void unknown_email_throws_same_exception() {
		// 저장된 사용자 없음

		assertThatThrownBy(() -> loginUseCase.execute(
			new LoginCommand("ghost@example.com", "whatever1")
		)).isInstanceOf(InvalidCredentialsException.class);
	}

	// ---------- In-memory fake ----------

	private static final class InMemoryUserRepository implements UserRepository {
		private final Map<UserId, User> byId = new HashMap<>();
		private final Map<String, User> byEmail = new HashMap<>();

		@Override
		public User save(User user) {
			byId.put(user.id(), user);
			byEmail.put(user.email().value(), user);
			return user;
		}

		@Override
		public Optional<User> findById(UserId id) {
			return Optional.ofNullable(byId.get(id));
		}

		@Override
		public Optional<User> findByEmail(Email email) {
			return Optional.ofNullable(byEmail.get(email.value()));
		}

		@Override
		public boolean existsByEmail(Email email) {
			return byEmail.containsKey(email.value());
		}

		@Override
		public Page<User> findAll(Pageable pageable) {
			return new PageImpl<>(byId.values().stream().toList(), pageable, byId.size());
		}
	}
}
