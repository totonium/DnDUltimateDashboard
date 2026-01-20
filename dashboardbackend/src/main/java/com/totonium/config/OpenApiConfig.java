// package com.totonium.config;

// import io.swagger.v3.oas.models.OpenAPI;
// import io.swagger.v3.oas.models.info.Contact;
// import io.swagger.v3.oas.models.info.Info;
// import io.swagger.v3.oas.models.info.License;
// import io.swagger.v3.oas.models.servers.Server;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;

// import java.util.List;

// @Configuration
// public class OpenApiConfig {

//     @Bean
//     public OpenAPI dndDashboardOpenAPI() {
//         return new OpenAPI()
//                 .info(new Info()
//                         .title("DnD Ultimate Dashboard API")
//                         .description("Backend API for DnD Ultimate Dashboard - A DM-focused tool for running D&D 5e sessions")
//                         .version("1.0.0")
//                         .contact(new Contact()
//                                 .name("Development Team")
//                                 .email("dev@example.com"))
//                         .license(new License()
//                                 .name("MIT")))
//                 .servers(List.of(
//                         new Server().url("http://localhost:8080").description("Development Server")
//                 ));
//     }
// }
