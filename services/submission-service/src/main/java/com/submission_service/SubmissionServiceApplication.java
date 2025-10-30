package com.submission_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import com.example.common_library.configuration.SecurityConfig;

@SpringBootApplication
@EnableJpaAuditing
@EnableFeignClients
@Import(SecurityConfig.class)
@EnableDiscoveryClient
@ComponentScan(basePackages = {
		"com.submission_service",
		"com.example.common_library"
})
public class SubmissionServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(SubmissionServiceApplication.class, args);
	}

}
