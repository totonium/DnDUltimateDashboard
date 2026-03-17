package com.totonium.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Filter for logging HTTP requests and responses.
 * Useful for debugging API calls and tracking issues.
 */
@Component
@Order(1)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);
    private static final String REQUEST_ID = "requestId";
    private static final int MAX_BODY_LENGTH = 1000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // Generate and set request ID for tracing
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put(REQUEST_ID, requestId);
        
        // Wrap request and response to enable body caching
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();

        try {
            // Log incoming request
            logRequest(wrappedRequest, requestId);

            // Continue with filter chain
            filterChain.doFilter(wrappedRequest, wrappedResponse);

            // Log response after processing
            logResponse(wrappedResponse, requestId, startTime);
        } catch (Exception e) {
            log.error("[{}] Error processing request: {}", requestId, e.getMessage());
            throw e;
        } finally {
            // Ensure response content is cached and available to the client
            wrappedResponse.copyBodyToResponse();
            MDC.remove(REQUEST_ID);
        }
    }

    private void logRequest(ContentCachingRequestWrapper request, String requestId) {
        String queryString = request.getQueryString();
        String uri = queryString != null ? request.getRequestURI() + "?" + queryString : request.getRequestURI();
        
        String headers = formatHeaders(request);
        
        log.info("[{}] --> {} {} | Headers: {}", 
                requestId, 
                request.getMethod(), 
                uri,
                headers);

        // Log request body if present and not too large
        if (log.isDebugEnabled()) {
            byte[] content = request.getContentAsByteArray();
            if (content.length > 0) {
                String body = truncate(new String(content, StandardCharsets.UTF_8));
                log.debug("[{}] Request body: {}", requestId, body);
            }
        }
    }

    private void logResponse(ContentCachingResponseWrapper response, String requestId, long startTime) {
        long duration = System.currentTimeMillis() - startTime;
        
        // Log response details
        log.info("[{}] <-- {} | Status: {} | Duration: {}ms",
                requestId,
                response.getStatus(),
                getStatusText(response.getStatus()),
                duration);

        // Log response body if debug enabled and not too large
        if (log.isDebugEnabled()) {
            byte[] content = response.getContentAsByteArray();
            if (content.length > 0) {
                String body = truncate(new String(content, StandardCharsets.UTF_8));
                log.debug("[{}] Response body: {}", requestId, body);
            }
        }
    }

    private String formatHeaders(HttpServletRequest request) {
        StringBuilder headers = new StringBuilder();
        request.getHeaderNames().asIterator().forEachRemaining(name -> {
            // Skip sensitive headers
            if (!name.equalsIgnoreCase("Authorization") && 
                !name.equalsIgnoreCase("Cookie")) {
                headers.append(name).append("=").append(request.getHeader(name)).append(", ");
            }
        });
        return headers.length() > 0 ? headers.substring(0, headers.length() - 2) : "none";
    }

    private String getStatusText(int status) {
        return switch (status) {
            case 200 -> "OK";
            case 201 -> "Created";
            case 204 -> "No Content";
            case 400 -> "Bad Request";
            case 401 -> "Unauthorized";
            case 403 -> "Forbidden";
            case 404 -> "Not Found";
            case 500 -> "Internal Server Error";
            default -> "";
        };
    }

    private String truncate(String text) {
        if (text == null || text.length() <= MAX_BODY_LENGTH) {
            return text;
        }
        return text.substring(0, MAX_BODY_LENGTH) + "... [truncated]";
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Don't log health/debug endpoints to reduce noise
        String uri = request.getRequestURI();
        return uri.equals("/api/v1/debug/health") || 
               uri.equals("/actuator/health") ||
               uri.startsWith("/actuator");
    }
}
