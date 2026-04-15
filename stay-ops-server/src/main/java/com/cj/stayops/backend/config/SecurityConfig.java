package com.cj.stayops.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.cj.stayops.backend.config.security.JwtAuthenticationFilter;
import com.cj.stayops.backend.config.security.RestAuthenticationEntryPoint;

@Configuration
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;

	public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
						  RestAuthenticationEntryPoint restAuthenticationEntryPoint) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
		this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.cors(Customizer.withDefaults())
			.csrf(csrf -> csrf.disable())
			// JWT 는 서버 세션을 쓰지 않음. Security 가 자동으로 세션 만드는 걸 차단.
			.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(authorize -> authorize
				.requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
				.requestMatchers("/api/auth/**").permitAll()
				.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
				// /api/users/** 를 permitAll → authenticated 로 전환.
				.requestMatchers("/api/users/**").authenticated()
				.anyRequest().authenticated()
			)
			.exceptionHandling(eh -> eh.authenticationEntryPoint(restAuthenticationEntryPoint))
			// UsernamePasswordAuthenticationFilter 앞 자리에 JWT 필터 삽입.
			.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
			// JWT 만 쓰므로 폼/베이직 로그인은 끔.
			.httpBasic(h -> h.disable())
			.formLogin(f -> f.disable());

		return http.build();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		// 개발 환경 프론트 오리진. 배포 시 프로퍼티로 분리하는 걸 권장.
		config.setAllowedOrigins(List.of(
			"http://localhost:5173",
			"http://127.0.0.1:5173"
		));
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setExposedHeaders(List.of("Authorization"));
		config.setAllowCredentials(true);
		config.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
