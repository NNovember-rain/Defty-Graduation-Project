package com.defty.question_bank_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
@ConditionalOnProperty(
        name = "springdoc.swagger-ui.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class OpenApiConfig {

        @Value("${app.gateway-url}")
        private String gatewayUrl;

        @Value("${app.api-prefix}")
        private String apiPrefix;

        @Bean
        public OpenAPI customOpenAPI() {
                return new OpenAPI()
                        .info(new Info()
                                .title("API document")
                                .version("1.0.0")
                                .description("Description of API document")
                        )
                        .addServersItem(new Server()
                                .url(gatewayUrl + apiPrefix + "/question-bank-service")
                                .description("API Gateway"))
                        .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                        .schemaRequirement("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT Authorization header using the Bearer scheme")
                        );
        }
}
