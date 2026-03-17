package com.totonium.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.info.BuildProperties;
import org.springframework.context.ApplicationContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Debug endpoints for troubleshooting and monitoring.
 * Should be disabled in production.
 */
@RestController
@RequestMapping("/api/v1/debug")
@Tag(name = "Debug", description = "Debug and diagnostic endpoints")
public class DebugController {

    private static final Logger log = LoggerFactory.getLogger(DebugController.class);

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired(required = false)
    private DataSource dataSource;

    @Autowired(required = false)
    private BuildProperties buildProperties;

    @GetMapping("/health")
    @Operation(summary = "Health check endpoint")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("timestamp", Instant.now().toString());
        
        // Application info
        Map<String, Object> app = new LinkedHashMap<>();
        app.put("name", applicationContext.getApplicationName());
        if (buildProperties != null) {
            app.put("version", buildProperties.getVersion());
        }
        health.put("application", app);
        
        // Database health
        Map<String, Object> db = new LinkedHashMap<>();
        try {
            if (dataSource != null) {
                try (Connection conn = dataSource.getConnection()) {
                    db.put("status", "UP");
                    db.put("url", conn.getMetaData().getURL());
                }
            } else {
                db.put("status", "UNKNOWN");
                db.put("reason", "DataSource not available");
            }
        } catch (Exception e) {
            log.error("Database health check failed", e);
            db.put("status", "DOWN");
            db.put("error", e.getMessage());
        }
        health.put("database", db);
        
        // Bean count
        health.put("beans", applicationContext.getBeanDefinitionCount());
        
        return ResponseEntity.ok(health);
    }

    @GetMapping("/info")
    @Operation(summary = "Get application information")
    public ResponseEntity<Map<String, Object>> info() {
        Map<String, Object> info = new LinkedHashMap<>();
        
        // Application info
        if (buildProperties != null) {
            info.put("name", buildProperties.getName());
            info.put("version", buildProperties.getVersion());
            info.put("time", buildProperties.getTime());
        }
        
        // Environment info
        info.put("activeProfiles", applicationContext.getEnvironment().getActiveProfiles());
        
        // Java info
        Map<String, String> java = new LinkedHashMap<>();
        java.put("version", System.getProperty("java.version"));
        java.put("vendor", System.getProperty("java.vendor"));
        info.put("java", java);
        
        // Memory info
        Map<String, Object> memory = new LinkedHashMap<>();
        Runtime runtime = Runtime.getRuntime();
        memory.put("total", runtime.totalMemory() / (1024 * 1024) + " MB");
        memory.put("free", runtime.freeMemory() / (1024 * 1024) + " MB");
        memory.put("max", runtime.maxMemory() / (1024 * 1024) + " MB");
        info.put("memory", memory);
        
        return ResponseEntity.ok(info);
    }
}
