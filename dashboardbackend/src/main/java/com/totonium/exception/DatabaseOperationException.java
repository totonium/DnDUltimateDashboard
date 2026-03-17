package com.totonium.exception;

/**
 * Exception thrown when a database operation fails.
 */
public class DatabaseOperationException extends RuntimeException {

    private final String operation;
    private final String entityName;

    public DatabaseOperationException(String operation, String entityName, Throwable cause) {
        super(String.format("Database %s failed for %s: %s", operation, entityName, cause.getMessage()), cause);
        this.operation = operation;
        this.entityName = entityName;
    }

    public String getOperation() {
        return operation;
    }

    public String getEntityName() {
        return entityName;
    }
}
