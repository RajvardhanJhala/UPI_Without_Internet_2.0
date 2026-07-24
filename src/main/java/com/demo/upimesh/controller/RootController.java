package com.demo.upimesh.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * The backend is a pure JSON API — the interactive UI is the separate React
 * app (deployed on Vercel). Hitting the API root directly returns a small
 * index so it's self-describing rather than a blank 404.
 */
@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> index() {
        return Map.of(
                "service", "UPI Offline Mesh API",
                "status", "ok",
                "repository", "https://github.com/RajvardhanJhala/UPI_Without_Internet_2.0",
                "endpoints", List.of(
                        "GET  /api/stats",
                        "GET  /api/accounts",
                        "GET  /api/transactions",
                        "GET  /api/mesh/state",
                        "GET  /api/mesh/events  (Server-Sent Events)",
                        "GET  /api/server-key",
                        "POST /api/demo/send",
                        "POST /api/mesh/gossip",
                        "POST /api/mesh/flush",
                        "POST /api/mesh/reset",
                        "POST /api/bridge/ingest"
                )
        );
    }
}
