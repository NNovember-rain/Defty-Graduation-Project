package com.example.common_library.service;

import com.example.common_library.dto.response.UserResponse;
import com.example.common_library.enums.ServiceErrorType;
import com.example.common_library.response.ServiceResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;
@Component
@Slf4j
public class ExternalServiceClient {

    private final RestTemplate restTemplate;
    private final RetryTemplate retryTemplate;

    public ExternalServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.retryTemplate = RetryTemplate.builder()
                .maxAttempts(3)
                .fixedBackoff(Duration.ofMillis(1000))
                .retryOn(ResourceAccessException.class)
                .retryOn(HttpServerErrorException.class)
                .build();
    }

    public <T> ServiceResponse<T> callExternalService(String url, Class<T> responseType, String serviceName) {
        return retryTemplate.execute(context -> {
            try {
                log.debug("Calling {} - URL: {} (attempt: {})", serviceName, url, context.getRetryCount() + 1);

                ResponseEntity<T> response = restTemplate.getForEntity(url, responseType);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return ServiceResponse.success(response.getBody());
                } else {
                    log.warn("Empty or unsuccessful response from {}: status={}", serviceName, response.getStatusCode());
                    return ServiceResponse.failure("Empty response from " + serviceName, ServiceErrorType.EMPTY_RESPONSE);
                }

            } catch (HttpClientErrorException e) {
                log.error("Client error calling {}: status={}, body={}", serviceName, e.getStatusCode(), e.getResponseBodyAsString());
                return ServiceResponse.failure("Client error: " + e.getMessage(), ServiceErrorType.CLIENT_ERROR);

            } catch (HttpServerErrorException e) {
                log.error("Server error calling {}: status={}, body={}",
                        serviceName, e.getStatusCode(), e.getResponseBodyAsString());
                return ServiceResponse.failure("Server error: " + e.getStatusCode(),
                        ServiceErrorType.SERVER_ERROR);
            }

            catch (ResourceAccessException e) {
                log.error("Network error calling {}: {}", serviceName, e.getMessage());
                return ServiceResponse.failure("Network error: " + e.getMessage(),
                        ServiceErrorType.NETWORK_ERROR);
            }

            catch (Exception e) {
                log.error("Unexpected error calling {}: {}", serviceName, e.getMessage(), e);
                return ServiceResponse.failure("Unexpected error: " + e.getMessage(),
                        ServiceErrorType.UNKNOWN_ERROR);
            }
        });
    }

    public ServiceResponse<UserResponse[]> getUsersByIds(List<Long> userIds) {
        if (userIds.isEmpty()) {
            return ServiceResponse.success(new UserResponse[0]);
        }

        String idsParam = userIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        String url = "http://localhost:8888/api/v1/identity/users/users-with-ids?userIds=" + idsParam;
        return callExternalService(url, UserResponse[].class, "identity");
    }
}



