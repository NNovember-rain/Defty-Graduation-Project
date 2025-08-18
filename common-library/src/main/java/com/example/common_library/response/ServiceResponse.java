package com.example.common_library.response;

import com.example.common_library.enums.ServiceErrorType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ServiceResponse<T> {
    private boolean success;
    private T data;
    private String errorMessage;
    private ServiceErrorType errorType;

    public static <T> ServiceResponse<T> success(T data) {
        return new ServiceResponse<>(true, data, null, null);
    }

    public static <T> ServiceResponse<T> failure(String errorMessage, ServiceErrorType errorType) {
        return new ServiceResponse<>(false, null, errorMessage, errorType);
    }
}