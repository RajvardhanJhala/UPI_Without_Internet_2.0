package com.rajvardhan.meshstatus.repository;

import com.rajvardhan.meshstatus.model.PaymentStat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentStatRepository extends JpaRepository<PaymentStat, Long> {
    List<PaymentStat> findTop10ByOrderBySettledAtDesc();
    List<PaymentStat> findTop50ByOrderBySettledAtDesc();
    List<PaymentStat> findTop50ByOutcomeOrderBySettledAtDesc(String outcome);
    long countByOutcome(String outcome);
}