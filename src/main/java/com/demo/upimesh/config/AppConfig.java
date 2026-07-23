package com.demo.upimesh.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableScheduling
public class AppConfig {

    /**
     * The frontend (Vite dev server locally, the deployed Vercel app in prod)
     * lives on a different origin than this API, so the browser needs an
     * explicit CORS allow-list. Comma-separated and configurable per
     * environment so a new Vercel domain doesn't require a code change.
     *
     * We use allowedOriginPatterns (not allowedOrigins) so a wildcard such as
     * https://*.vercel.app also covers Vercel's per-deploy preview URLs — patterns
     * accept exact origins too, so a plain URL still works.
     */
    @Bean
    public WebMvcConfigurer corsConfigurer(
            @Value("${upi.mesh.cors-allowed-origins:http://localhost:5173}") String allowedOrigins) {
        String[] origins = allowedOrigins.split(",");
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOriginPatterns(origins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
