package com.gymnotes.domain;

import com.gymnotes.domain.enums.EquipmentType;
import com.gymnotes.domain.enums.MuscleGroup;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "muscle_group", nullable = false, length = 50)
    private MuscleGroup muscleGroup;

    @Enumerated(EnumType.STRING)
    @Column(name = "equipment", length = 50)
    private EquipmentType equipment;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ElementCollection
    @CollectionTable(
            name = "exercise_secondary_muscle_groups",
            joinColumns = @JoinColumn(name = "exercise_id")
    )
    @Column(name = "muscle_group", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private List<MuscleGroup> secondaryMuscleGroups = new ArrayList<>();
}

