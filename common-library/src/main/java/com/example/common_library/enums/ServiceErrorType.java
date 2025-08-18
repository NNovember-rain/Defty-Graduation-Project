package com.example.common_library.enums;

public enum ServiceErrorType {
    CLIENT_ERROR,      // 4xx errors
    SERVER_ERROR,      // 5xx errors
    NETWORK_ERROR,     // Connection issues
    EMPTY_RESPONSE,    // Successful but empty response
    UNKNOWN_ERROR      // Unexpected errors
}