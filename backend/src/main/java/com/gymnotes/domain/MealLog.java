package com.gymnotes.domain;

import com.gymnotes.domain.enums.MealType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "meal_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MealLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false, length = 30)
    private MealType mealType;

    @Column(name = "logged_at", nullable = false)
    private Instant loggedAt;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Builder.Default
    @OneToMany(mappedBy = "mealLog", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MealItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.loggedAt == null) {
            this.loggedAt = Instant.now();
        }
    }

    public void addItem(MealItem item) {
        items.add(item);
        item.setMealLog(this);
    }

    public void removeItem(MealItem item) {
        items.remove(item);
        item.setMealLog(null);
    }
}

