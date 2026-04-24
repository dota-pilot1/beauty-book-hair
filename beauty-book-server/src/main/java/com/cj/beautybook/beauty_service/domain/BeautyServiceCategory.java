package com.cj.beautybook.beauty_service.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "beauty_service_categories", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BeautyServiceCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40, unique = true)
    private String code;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private boolean visible = true;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static BeautyServiceCategory create(
            String code,
            String name,
            String description,
            boolean visible,
            int displayOrder
    ) {
        BeautyServiceCategory category = new BeautyServiceCategory();
        category.code = code;
        category.name = name;
        category.description = description;
        category.visible = visible;
        category.displayOrder = displayOrder;
        return category;
    }

    public void update(String name, String description, boolean visible, int displayOrder) {
        this.name = name;
        this.description = description;
        this.visible = visible;
        this.displayOrder = displayOrder;
    }
}
