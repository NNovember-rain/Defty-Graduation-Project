package com.defty.identity.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error",HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "Username existed", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1002, "Email existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least 3 characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least 8 characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    LOGIN_ERROR(1008, "Invalid login credentials. Please try again.", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1009, "Invalid email. Please try again.", HttpStatus.BAD_REQUEST),
    EMAIL_REQUIRED(1010, "Email is required", HttpStatus.BAD_REQUEST),
    USERNAME_REQUIRED(1011, "Username is required", HttpStatus.BAD_REQUEST),
    PASSWORD_REQUIRED(1012, "Password is required", HttpStatus.BAD_REQUEST),
    ROLE_DELETE_FORBIDDEN(1013, "Deleting this role is not allowed", HttpStatus.BAD_REQUEST),
    ROLE_INACTIVE_FORBIDDEN(1013, "This role is inactive and cannot be used", HttpStatus.BAD_REQUEST),
    ROLE_EXISTED(1014, "Role existed", HttpStatus.BAD_REQUEST),
    PERMISSION_EXISTED(1015, "Permission existed", HttpStatus.BAD_REQUEST),
    ROLE_NOT_EXISTED(1016, "Role not existed", HttpStatus.NOT_FOUND),
    USER_CODE_EXISTED(1002, "User code existed", HttpStatus.BAD_REQUEST),
    TYPE_UML_EXISTED(2001, "Type UML already exists", HttpStatus.BAD_REQUEST),
    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}

