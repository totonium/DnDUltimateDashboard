package com.totonium.exception;

/**
 * Exception thrown when an authentication or authorization error occurs.
 */
public class AuthenticationException extends RuntimeException {

    private final String reason;

    public AuthenticationException(String reason) {
        super(reason);
        this.reason = reason;
    }

    public AuthenticationException(String reason, Throwable cause) {
        super(reason, cause);
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }
}
