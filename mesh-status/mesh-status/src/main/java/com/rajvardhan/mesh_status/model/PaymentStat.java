package com.rajvardhan.meshstatus.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class PaymentStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sender;
    private String receiver;
    private long amountPaise;
    private String outcome;
    private Instant settledAt;

    // Constructor
    public PaymentStat(String sender, String receiver, long amountPaise, String outcome, Instant settledAt) {
        this.sender = sender;
        this.receiver = receiver;
        this.amountPaise = amountPaise;
        this.outcome = outcome;
        this.settledAt = settledAt;
    }

    // Default constructor — JPA requires this
    public PaymentStat() {}

    // Getters
    public Long getId() { return id; }
    public String getSender() { return sender; }
    public String getReceiver() { return receiver; }
    public long getAmountPaise() { return amountPaise; }
    public String getOutcome() { return outcome; }
    public Instant getSettledAt() { return settledAt; }
}