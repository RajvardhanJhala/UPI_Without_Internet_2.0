package com.rajvardhan.meshstatus;

import com.rajvardhan.meshstatus.model.PaymentStat;
import com.rajvardhan.meshstatus.repository.PaymentStatRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.time.Instant;

@SpringBootApplication
public class MeshStatusApplication {

    private final PaymentStatRepository repo;

    public MeshStatusApplication(PaymentStatRepository repo) {
        this.repo = repo;
    }

    public static void main(String[] args) {
        SpringApplication.run(MeshStatusApplication.class, args);
    }

    @PostConstruct
    public void seed() {
        if (repo.count() > 0) return;
        Instant now = Instant.now();
        repo.save(new PaymentStat("alice@upi", "bob@upi",   50000, "SETTLED",           now));
        repo.save(new PaymentStat("alice@upi", "bob@upi",   50000, "DUPLICATE_DROPPED", now));
        repo.save(new PaymentStat("eve@upi",   "carol@upi", 20000, "INVALID",           now));
        repo.save(new PaymentStat("bob@upi",   "alice@upi", 10000, "SETTLED",           now));
        repo.save(new PaymentStat("carol@upi", "dave@upi",  75000, "SETTLED",           now));
        repo.save(new PaymentStat("dave@upi",  "carol@upi", 25000, "DUPLICATE_DROPPED", now));
    }
}