package com.cj.stayops.backend.auth.application;

import java.time.Clock;
import java.time.Instant;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.auth.application.dto.SignupCommand;
import com.cj.stayops.backend.auth.application.dto.SignupResult;
import com.cj.stayops.backend.auth.domain.exception.DuplicateEmailException;
import com.cj.stayops.backend.auth.domain.exception.WeakPasswordException;
import com.cj.stayops.backend.auth.domain.model.Email;
import com.cj.stayops.backend.auth.domain.model.User;
import com.cj.stayops.backend.auth.domain.model.UserId;
import com.cj.stayops.backend.auth.domain.repository.UserRepository;

/**
 * 회원가입 유스케이스.
 * <p>
 * 책임:
 * <ol>
 *   <li>비밀번호 정책 검증 (형식은 Presentation의 Bean Validation이 1차 담당)</li>
 *   <li>이메일 중복 체크</li>
 *   <li>비밀번호 해싱</li>
 *   <li>User Aggregate 생성 및 영속화</li>
 * </ol>
 */
@Service
public class SignupUseCase {

	private static final int MIN_PASSWORD_LENGTH = 8;
	private static final int MAX_PASSWORD_LENGTH = 72; // BCrypt 제한

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final Clock clock;

	public SignupUseCase(UserRepository userRepository,
						 PasswordEncoder passwordEncoder,
						 Clock clock) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.clock = clock;
	}

	@Transactional
	public SignupResult execute(SignupCommand command) {
		// ========== 1단계: 유효성 검증 ==========

		// (1-1) 이메일 형식 검증
		//   Email.of(...)는 정적 팩토리 메서드. null/blank, 길이(≤254), 정규식을 통과해야만
		//   Email VO가 생성된다. 실패 시 InvalidEmailException.
		//   즉, 이 줄을 통과했다는 것은 "email 변수는 반드시 유효한 이메일"임을 타입으로 보장.
		Email email = Email.of(command.email());

		// (1-2) 비밀번호 정책 검증
		//   길이(8~72자) + 영문자 1개 + 숫자 1개 필수. 실패 시 WeakPasswordException.
		validatePasswordPolicy(command.rawPassword());

		// (1-3) 이메일 중복 검증
		//   DB에 동일 이메일이 이미 존재하면 409 Conflict 흐름으로.
		//   주의: existsByEmail과 save 사이에 race condition이 있을 수 있어,
		//   최종 방어는 DB의 unique 제약(UserJpaEntity의 @Index unique=true)이 담당.
		if (userRepository.existsByEmail(email)) {
			throw new DuplicateEmailException(email.value());
		}

		// ========== 2단계: 도메인 객체 생성 ==========

		// (2-1) 비밀번호 해싱
		//   도메인(User)은 해싱 알고리즘을 모른다. Application Layer가 BCrypt로 해시 후
		//   해시된 값만 도메인에 넘긴다.
		String passwordHash = passwordEncoder.encode(command.rawPassword());

		// (2-2) User Aggregate 생성 (메모리 상 객체, 아직 DB 저장 전)
		//   UserId는 도메인에서 UUID로 미리 생성 (DB auto-increment에 의존 X).
		//   Clock 주입으로 생성 시각을 테스트에서 고정 가능.
		Instant now = Instant.now(clock);
		User user = User.register(
			UserId.generate(),
			email,
			passwordHash,
			command.name(),
			now
		);

		// ========== 3단계: 영속화 및 결과 반환 ==========

		// (3-1) DB 저장
		//   Repository는 도메인 User를 받아 내부에서 UserJpaEntity로 매핑 후 저장.
		//   반환값 saved는 영속화된 User (동일한 값이지만 명시적으로 구분).
		User saved = userRepository.save(user);

		// (3-2) 호출자에게 노출용 DTO로 변환하여 반환
		//   User 도메인 객체를 직접 반환하지 않는다 (passwordHash 노출 방지 + 결합 방지).
		return SignupResult.from(saved);
	}

	private void validatePasswordPolicy(String rawPassword) {
		if (rawPassword == null || rawPassword.isBlank()) {
			throw new WeakPasswordException("Password must not be blank");
		}
		if (rawPassword.length() < MIN_PASSWORD_LENGTH) {
			throw new WeakPasswordException(
				"Password must be at least " + MIN_PASSWORD_LENGTH + " characters"
			);
		}
		if (rawPassword.length() > MAX_PASSWORD_LENGTH) {
			throw new WeakPasswordException(
				"Password must not exceed " + MAX_PASSWORD_LENGTH + " characters"
			);
		}
		// 최소: 영문자 1개 + 숫자 1개
		boolean hasLetter = rawPassword.chars().anyMatch(Character::isLetter);
		boolean hasDigit = rawPassword.chars().anyMatch(Character::isDigit);
		if (!hasLetter || !hasDigit) {
			throw new WeakPasswordException(
				"Password must contain at least one letter and one digit"
			);
		}
	}
}
