package com.cj.stayops.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;

/**
 * springdoc-openapi 메타데이터 설정.
 * <p>
 * UI: http://localhost:8080/swagger-ui.html
 * JSON: http://localhost:8080/v3/api-docs
 */
@Configuration
public class OpenApiConfig {

	@Bean
	OpenAPI stayOpsOpenAPI() {
		return new OpenAPI()
			.info(new Info()
				.title("stay-ops API")
				.description("숙박 운영 관리 시스템 백엔드 API")
				.version("v0.0.1")
				.contact(new Contact().name("stay-ops team"))
				.license(new License().name("Proprietary")));
	}
}
