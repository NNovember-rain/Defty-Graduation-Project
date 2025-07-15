package com.example.common_library.exceptions;

public class FieldRequiredException extends RuntimeException{
    public FieldRequiredException(String s) {
        super(s);
    }
}

