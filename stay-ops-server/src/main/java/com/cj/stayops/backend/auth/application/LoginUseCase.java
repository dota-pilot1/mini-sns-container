package com.cj.stayops.backend.auth.application;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cj.stayops.backend.auth.application.dto.LoginCommand;
import com.cj.stayops.backend.auth.application.dto.LoginResult;
import com.cj.stayops.backend.auth.domain.exception.InvalidCredentialsException;
import com.cj.stayops.backend.auth.infrastructure.security.JwtProperties;
import com.cj.stayops.backend.auth.infrastructure.security.JwtTokenProvider;
import com.cj.stayops.backend.user.domain.model.Email;
import com.cj.stayops.backend.user.domain.model.User;
import com.cj.stayops.backend.user.domain.repository.UserRepository;

/**
 * 로그인 유스케이스.
 * <p>
 * 책임:
 * <ol>
 *   <li>이메일 형식 검증 (Email VO 생성 단계에서 담당)</li>
 *   <li>사용자 조회 + 비밀번호 일치 확인 (실패는 모두 {@link InvalidCredentialsException} 로 통일)</li>
 *   <li>JWT Access Token 발급</li>
 *   <li>프론트에 돌려줄 {@link LoginResult} 조립</li>
 * </ol>
 *
 * <h3>보안 원칙</h3>
 * <ul>
 *   <li>"존재하지 않는 이메일" 과 "비밀번호 불일치" 를 구분해서 응답하지 않음 → 계정 enumeration 방지</li>
 *   <li>비밀번호 비교는 {@link PasswordEncoder#matches(CharSequence, String)} (timing-safe)</li>
 *   <li>{@code passwordHash} 는 로그/응답 어디에도 노출 금지</li>
 * </ul>
 */
@Service
public class LoginUseCase {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenProvider jwtTokenProvider;
	private final JwtProperties jwtProperties;
	private final Clock clock;

	public LoginUseCase(UserRepository userRepository,
						PasswordEncoder passwordEncoder,
						JwtTokenProvider jwtTokenProvider,
						JwtProperties jwtProperties,
						Clock clock) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtTokenProvider = jwtTokenProvider;
		this.jwtProperties = jwtProperties;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public LoginResult execute(LoginCommand command) {
		// (1) 이메일 형식 검증
		//   Email.of 는 InvalidEmailException 을 던질 수 있음 → 400 으로 매핑됨 (기존 핸들러).
		//   여기까진 "자격 증명 실패" 가 아니라 "입력 자체가 잘못" 인 케이스라 의도적으로 구분.
		Email email = Email.of(command.email());

		// (2) 사용자 조회
		//   존재하지 않더라도 비밀번호 불일치와 동일한 예외로 처리 → 계정 enumeration 방지.
		Optional<User> found = userRepository.findByEmail(email);
		User user = found.orElseThrow(
			() -> new InvalidCredentialsException("Invalid email or password")
		);

		// (3) 비밀번호 일치 확인 (timing-safe)
		if (!passwordEncoder.matches(command.rawPassword(), user.passwordHash())) {
			throw new InvalidCredentialsException("Invalid email or password");
		}

		// (4) JWT 발급
		Instant now = Instant.now(clock);
		String accessToken = jwtTokenProvider.issue(user.id(), user.email(), now);

		// (5) 응답 조립
		return new LoginResult(
			accessToken,
			"Bearer",
			jwtProperties.accessTokenTtlSeconds(),
			user.id().asString(),
			user.email().value(),
			user.name()
		);
	}
}
