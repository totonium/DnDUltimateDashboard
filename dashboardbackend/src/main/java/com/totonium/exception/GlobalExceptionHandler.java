package com.totonium.exception;

import com.totonium.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.UUID;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        String requestId = getRequestId();
        log.warn("[{}] Resource not found: {} with id={} | Path: {}", 
                requestId, ex.getResourceName(), ex.getIdentifier(), request.getRequestURI());
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", ex.getMessage(), 
                        String.format("%s: %s", ex.getResourceName(), ex.getIdentifier()),
                        requestId, request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String requestId = getRequestId();
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        
        log.warn("[{}] Validation failed: {} | Path: {}", requestId, details, request.getRequestURI());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("VALIDATION_ERROR", "Validation failed", details, requestId, request.getRequestURI()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        String requestId = getRequestId();
        log.warn("[{}] Illegal argument: {} | Path: {}", requestId, ex.getMessage(), request.getRequestURI());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("BAD_REQUEST", ex.getMessage(), null, requestId, request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String requestId = getRequestId();
        String details = String.format("Parameter '%s' expected type '%s', got '%s'", 
                ex.getName(), ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown", ex.getValue());
        
        log.warn("[{}] Type mismatch: {} | Path: {}", requestId, details, request.getRequestURI());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("BAD_REQUEST", "Invalid parameter type", details, requestId, request.getRequestURI()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        String requestId = getRequestId();
        log.warn("[{}] Access denied: {} | Path: {}", requestId, ex.getMessage(), request.getRequestURI());
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("FORBIDDEN", "Access denied", ex.getMessage(), requestId, request.getRequestURI()));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        String requestId = getRequestId();
        log.warn("[{}] Authentication failed: {} | Path: {}", requestId, ex.getReason(), request.getRequestURI());
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("UNAUTHORIZED", "Authentication failed", ex.getReason(), requestId, request.getRequestURI()));
    }

    @ExceptionHandler(DatabaseOperationException.class)
    public ResponseEntity<ErrorResponse> handleDatabaseOperation(DatabaseOperationException ex, HttpServletRequest request) {
        String requestId = getRequestId();
        log.error("[{}] Database operation failed: {} | Path: {}", 
                requestId, ex.getMessage(), request.getRequestURI(), ex);
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("DATABASE_ERROR", "Database operation failed", ex.getMessage(), requestId, request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        String requestId = getRequestId();
        
        // Log the full stack trace for debugging
        log.error("[{}] Unhandled exception: {} | Path: {}", 
                requestId, ex.getMessage(), request.getRequestURI(), ex);
        
        // In development, we can return more details
        String details = log.isDebugEnabled() 
                ? ex.getClass().getName() + ": " + ex.getMessage() 
                : "An unexpected error occurred. Please check server logs.";
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred", details, requestId, request.getRequestURI()));
    }

    private String getRequestId() {
        String requestId = MDC.get("requestId");
        return requestId != null ? requestId : UUID.randomUUID().toString().substring(0, 8);
    }
}
