package com.example.common_library.exceptions;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
@Getter
public enum ErrorCode {

    // =========================
    // General errors (1000 - 1999)
    // =========================
    UNCATEGORIZED_EXCEPTION(1000, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1001, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(1002, "You do not have permission", HttpStatus.FORBIDDEN),
    NOT_FOUND(1003, "Resource not found", HttpStatus.NOT_FOUND),
    BAD_REQUEST(1004, "Bad request", HttpStatus.BAD_REQUEST),
    INTERNAL_SERVER_ERROR(1005, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    ALREADY_EXISTS(1006, "Already exists", HttpStatus.BAD_REQUEST),

    // =========================
    // Auth errors (2000 - 2999)
    // =========================
    INVALID_LOGIN_CREDENTIALS(2001, "Invalid login credentials. Please try again.", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(2002, "User does not exist", HttpStatus.NOT_FOUND),
    EMAIL_ALREADY_EXISTS(2003, "Email already exists", HttpStatus.BAD_REQUEST),
    USERNAME_ALREADY_EXISTS(2004, "Username already exists", HttpStatus.BAD_REQUEST),
    USER_NOT_ACTIVATED(2005, "User not active", HttpStatus.BAD_REQUEST),
    LOGIN_ERROR(2006, "Invalid login credentials. Please try again.", HttpStatus.BAD_REQUEST),

    // (Merge thêm từ enum 2)
    INVALID_KEY(2007, "Invalid key", HttpStatus.BAD_REQUEST),

    // =========================
    // Validation errors (3000 - 3999)
    // =========================
    VALIDATION_FAILED(3001, "Validation failed", HttpStatus.BAD_REQUEST),
    FIELD_REQUIRED(3002, "A required field is missing", HttpStatus.BAD_REQUEST),
    INVALID_PARAM(3003, "Invalid parameter", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL_FORMAT(3004, "Invalid email format", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD_FORMAT(3005, "Invalid password format. Must be at least 8 characters.", HttpStatus.BAD_REQUEST),
    CONSTRAINT_VIOLATION(3006, "Database constraint violation", HttpStatus.BAD_REQUEST),
    INVALID_DATE(3007, "Invalid date format or value", HttpStatus.BAD_REQUEST),
    INVALID_JSON_FORMAT(3008, "Invalid JSON format", HttpStatus.BAD_REQUEST),
    JSON_SIZE_EXCEEDED(3009, "JSON content exceeds size limit", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(3010, "Invalid password", HttpStatus.BAD_REQUEST),
    NEW_PASSWORD_SAME_AS_OLD(3011, "New password must be different from the current password", HttpStatus.BAD_REQUEST),
    PASSWORD_CONFIRMATION_MISMATCH(3012, "Password confirmation does not match", HttpStatus.BAD_REQUEST),
    INVALID_OTP(3013, "Invalid or expired OTP", HttpStatus.BAD_REQUEST),
    OTP_MAX_RETRY_EXCEEDED(3014, "OTP has been locked due to too many failed attempts", HttpStatus.BAD_REQUEST),
    TOKEN_EXPIRED(3015, "Token expired", HttpStatus.BAD_REQUEST),
    INVALID_TOKEN(3016, "Invalid token", HttpStatus.BAD_REQUEST),

    // (Merge từ enum 2)
    USERNAME_INVALID(3017, "Username must be at least 3 characters", HttpStatus.BAD_REQUEST),
    EMAIL_REQUIRED(3018, "Email is required", HttpStatus.BAD_REQUEST),
    USERNAME_REQUIRED(3019, "Username is required", HttpStatus.BAD_REQUEST),
    PASSWORD_REQUIRED(3020, "Password is required", HttpStatus.BAD_REQUEST),

    // =========================
    // File/Media errors (4000 - 4999)
    // =========================
    MEDIA_UPLOAD_FAILED(4001, "Media upload failed", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_FILE(4002, "Invalid file type or empty file", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(4003, "File size exceeds the allowed limit", HttpStatus.PAYLOAD_TOO_LARGE),
    UNSUPPORTED_MEDIA_FORMAT(4005, "Unsupported media format", HttpStatus.UNSUPPORTED_MEDIA_TYPE),
    MEDIA_NOT_FOUND(4006, "Media resource not found", HttpStatus.NOT_FOUND),
    MEDIA_STORAGE_ERROR(4007, "Error occurred while storing media", HttpStatus.INTERNAL_SERVER_ERROR),

    // =========================
    // Business errors (5000 - 5999)
    // =========================
    CONFLICT(5001, "Conflict with existing data", HttpStatus.CONFLICT);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}


