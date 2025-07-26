package com.defty.content_service;

import com.example.common_library.configuration.SecurityConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
@EnableFeignClients
@EnableDiscoveryClient
@Import(SecurityConfig.class)
public class ContentServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ContentServiceApplication.class, args);
	}

}
