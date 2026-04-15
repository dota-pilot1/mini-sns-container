package com.cj.stayops.backend.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 애플리케이션 공통 빈 설정.
 */
@Configuration
public class ApplicationConfig {

	/**
	 * UseCase에서 시간 의존성을 주입받기 위한 Clock.
	 * 테스트에서 {@code Clock.fixed(...)}로 교체하기 쉽다.
	 */
	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}
}
