package com.example.common_library.exceptions;

public class DuplicateEntryException extends RuntimeException {

    public DuplicateEntryException(String message) {
        super(message);
    }

    public DuplicateEntryException(String field, Object value) {
        super(String.format("Trường '%s' với giá trị '%s' đã tồn tại.", field, value));
    }
}