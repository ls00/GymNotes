package com.gymnotes.domain;

import com.gymnotes.domain.enums.WorkoutTechnique;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "workout_sets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutSet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_session_id", nullable = false)
    private WorkoutSession workoutSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "set_order", nullable = false)
    private Integer setOrder;

    @Column(name = "reps", nullable = false)
    private Integer reps;

    @Column(name = "weight_kg", nullable = false, precision = 6, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "rpe", precision = 3, scale = 1)
    private BigDecimal rpe;

    @Builder.Default
    @Column(name = "is_warmup", nullable = false)
    private Boolean isWarmup = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "technique", nullable = false, length = 30)
    @Builder.Default
    private WorkoutTechnique technique = WorkoutTechnique.NORMAL;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "distance_km", precision = 7, scale = 2)
    private BigDecimal distanceKm;
}

