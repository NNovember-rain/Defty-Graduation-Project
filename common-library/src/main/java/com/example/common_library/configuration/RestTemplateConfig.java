package com.example.common_library.configuration;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.time.Duration;
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate(clientHttpRequestFactory());
        restTemplate.getInterceptors().add((request, body, execution) -> {
            String token = getCurrentToken(); // Lấy token hiện tại từ context/session
            if (token != null) {
                request.getHeaders().add("Authorization", "Bearer " + token);
            }
            return execution.execute(request, body);
        });
        return restTemplate;
    }

    private String getCurrentToken() {
        // Nếu đang dùng Spring Security:
//        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
//            return jwtAuth.getToken().getTokenValue();
//        }
        return null;
    }

    @Bean
    public ClientHttpRequestFactory clientHttpRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));  // 5 seconds
        factory.setReadTimeout(Duration.ofSeconds(10));    // 10 seconds
        return factory;
    }

    @Bean
    public RetryTemplate retryTemplate() {
        return RetryTemplate.builder()
                .maxAttempts(3)
                .fixedBackoff(Duration.ofMillis(1000))
                .retryOn(this::shouldRetry)
                .build();
    }

    private boolean shouldRetry(Throwable throwable) {
        return throwable instanceof ResourceAccessException ||
                throwable instanceof HttpServerErrorException ||
                throwable instanceof SocketTimeoutException ||
                throwable instanceof ConnectException;
    }
}