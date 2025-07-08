package com.example.common_library.exceptions;

public class AlreadyExitException extends RuntimeException {
    public AlreadyExitException(String message) {
        super(message);
    }
}