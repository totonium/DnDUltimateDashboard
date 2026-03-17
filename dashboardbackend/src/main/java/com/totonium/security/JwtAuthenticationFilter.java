package com.totonium.security;

import com.totonium.entity.User;
import com.totonium.repository.UserRepository;
import com.totonium.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("No valid Authorization header found for: {}", request.getMethod());
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        try {
            // Validate token and get user ID
            UUID userId = jwtService.validateTokenAndGetUserId(jwt);
            log.debug("Token validated for user ID: {}", userId);

            // Get user from database to retrieve email
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> {
                        log.warn("User not found for ID: {}", userId);
                        return new UsernameNotFoundException("User not found");
                    });

            // Load full UserDetails with authorities
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            log.debug("User authenticated: {}", user.getEmail());

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    user.getEmail(),  // Principal: email string (for getName() to work correctly)
                    null,             // Credentials: not needed after auth
                    userDetails.getAuthorities()  // Authorities from UserDetails
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);

        } catch (Exception e) {
            log.warn("JWT authentication failed: {}", e.getMessage());
            // Don't throw - let the request continue without authentication
            // Security config will handle unauthorized access
        }

        filterChain.doFilter(request, response);
    }
}