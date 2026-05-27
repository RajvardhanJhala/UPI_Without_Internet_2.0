package com.rajvardhan.meshstatus.controller;

import com.rajvardhan.meshstatus.model.PaymentStat;
import com.rajvardhan.meshstatus.repository.PaymentStatRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StatsApiController {

    private final PaymentStatRepository repo;

    public StatsApiController(PaymentStatRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/stats")
    public Map<String, Long> stats() {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("settled", repo.countByOutcome("SETTLED"));
        counts.put("dropped", repo.countByOutcome("DUPLICATE_DROPPED"));
        counts.put("invalid", repo.countByOutcome("INVALID"));
        counts.put("total", repo.count());
        return counts;
    }

    @GetMapping("/transactions")
    public List<Map<String, Object>> transactions(
            @RequestParam(required = false) String outcome) {
        List<PaymentStat> rows = outcome == null || outcome.isBlank()
                ? repo.findTop50ByOrderBySettledAtDesc()
                : repo.findTop50ByOutcomeOrderBySettledAtDesc(outcome);
        return rows.stream().map(this::toMap).toList();
    }

    @PostMapping("/transactions")
    public ResponseEntity<Map<String, Object>> record(@RequestBody RecordRequest req) {
        if (req.sender() == null || req.sender().isBlank()
                || req.receiver() == null || req.receiver().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String outcome = normalizeOutcome(req.outcome());
        long paise = Math.max(0, req.amountPaise());
        PaymentStat stat = new PaymentStat(
                req.sender().trim(),
                req.receiver().trim(),
                paise,
                outcome,
                Instant.now());
        repo.save(stat);
        return ResponseEntity.ok(toMap(stat));
    }

    @DeleteMapping("/transactions")
    public Map<String, String> clearAll() {
        repo.deleteAll();
        return Map.of("status", "cleared");
    }

    private String normalizeOutcome(String outcome) {
        if (outcome == null) return "SETTLED";
        return switch (outcome.toUpperCase()) {
            case "DUPLICATE_DROPPED", "DROPPED" -> "DUPLICATE_DROPPED";
            case "INVALID" -> "INVALID";
            default -> "SETTLED";
        };
    }

    private Map<String, Object> toMap(PaymentStat tx) {
        return Map.of(
                "id", tx.getId(),
                "sender", tx.getSender(),
                "receiver", tx.getReceiver(),
                "amountPaise", tx.getAmountPaise(),
                "amountRupees", tx.getAmountPaise() / 100.0,
                "outcome", tx.getOutcome(),
                "settledAt", tx.getSettledAt().toString());
    }

    public record RecordRequest(String sender, String receiver, long amountPaise, String outcome) {}
}
