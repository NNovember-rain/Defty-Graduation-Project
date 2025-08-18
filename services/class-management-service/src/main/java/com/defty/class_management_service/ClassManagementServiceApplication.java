package com.defty.class_management_service;

import com.example.common_library.configuration.SecurityConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
@EnableDiscoveryClient
@EnableFeignClients
@Import(SecurityConfig.class)
@ComponentScan(basePackages = {
		"com.defty.class_management_service",              // package của ứng dụng chính
		"com.example.common_library"          // thêm package của thư viện chung
})
public class ClassManagementServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClassManagementServiceApplication.class, args);
	}

}
