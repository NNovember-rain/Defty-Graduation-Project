package com.defty.question_bank_service;

import com.defty.question_bank_service.dto.response.ApiResponse;
import com.example.common_library.configuration.SecurityConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

//@SpringBootApplication
//@EnableFeignClients
//@EnableDiscoveryClient
//@EnableJpaAuditing
//@EnableScheduling
@SpringBootApplication
@EnableJpaAuditing
@EnableDiscoveryClient
@EnableFeignClients
@Import(SecurityConfig.class)
@ComponentScan(
        basePackages = {
                "com.defty.question_bank_service",
                "com.example.common_library"
        },
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = com.example.common_library.configuration.MapperConfig.class
        )
)
@EnableScheduling
public class QuestionBankServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuestionBankServiceApplication.class, args);
	}

}
