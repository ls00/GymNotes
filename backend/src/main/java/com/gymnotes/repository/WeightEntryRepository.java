package com.gymnotes.repository;

import com.gymnotes.domain.WeightEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WeightEntryRepository extends JpaRepository<WeightEntry, UUID> {
    List<WeightEntry> findByUserIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(
            UUID userId,
            LocalDate startDate,
            LocalDate endDate);

    Optional<WeightEntry> findFirstByUserIdOrderByMeasuredAtDesc(UUID userId);

    Optional<WeightEntry> findByUserIdAndMeasuredAt(UUID userId, LocalDate measuredAt);
}
