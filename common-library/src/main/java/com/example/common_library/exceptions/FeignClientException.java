package com.example.common_library.exceptions;

public class FeignClientException extends RuntimeException {
  public FeignClientException(String message) {
    super(message);
  }
}
