package com.defty.class_management_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class ClassManagementServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClassManagementServiceApplication.class, args);
	}

}
