package com.cj.stayops.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class StayOpsServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(StayOpsServerApplication.class, args);
	}

}
