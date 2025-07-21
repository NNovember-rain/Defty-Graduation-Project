package com.ai_feedback_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class AiFeedbackServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AiFeedbackServiceApplication.class, args);
	}

}
