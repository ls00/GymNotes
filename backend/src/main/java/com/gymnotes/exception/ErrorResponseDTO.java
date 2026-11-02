package com.gymnotes.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponseDTO(
    Instant timestamp,
    int status,
    String error,
    String message,
    String path,
    Map<String, String> fieldErrors
) {
    public static ErrorResponseDTO of(int status, String error, String message, String path) {
        return ErrorResponseDTO.builder()
            .timestamp(Instant.now())
            .status(status)
            .error(error)
            .message(message)
            .path(path)
            .build();
    }

    public static ErrorResponseDTO of(int status, String error, String message, String path, Map<String, String> fieldErrors) {
        return ErrorResponseDTO.builder()
            .timestamp(Instant.now())
            .status(status)
            .error(error)
            .message(message)
            .path(path)
            .fieldErrors(fieldErrors)
            .build();
    }
}

