package com.example.common_library.exceptions;

import lombok.Getter;

import java.util.List;

@Getter
public class ValidationException extends RuntimeException {
  private final List<FieldErrorDetail> fieldErrors;

  public ValidationException(String message, List<FieldErrorDetail> fieldErrors) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}