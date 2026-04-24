package com.cj.beautybook.beauty_service.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "beauty_services", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BeautyService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80, unique = true)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private BeautyServiceCategory category;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BeautyServiceTargetGender targetGender;

    @Column(nullable = false)
    private boolean visible = true;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "beauty_service_images",
            joinColumns = @JoinColumn(name = "beauty_service_id")
    )
    @OrderColumn(name = "display_order")
    @Column(name = "image_url", nullable = false, length = 1000)
    private List<String> imageUrls = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static BeautyService create(
            String code,
            String name,
            BeautyServiceCategory category,
            String description,
            Integer durationMinutes,
            BigDecimal price,
            BeautyServiceTargetGender targetGender,
            boolean visible,
            Integer displayOrder,
            List<String> imageUrls
    ) {
        BeautyService service = new BeautyService();
        service.code = code;
        service.name = name;
        service.category = category;
        service.description = description;
        service.durationMinutes = durationMinutes;
        service.price = price;
        service.targetGender = targetGender;
        service.visible = visible;
        service.displayOrder = displayOrder;
        service.replaceImageUrls(imageUrls);
        return service;
    }

    public void update(
            String name,
            BeautyServiceCategory category,
            String description,
            Integer durationMinutes,
            BigDecimal price,
            BeautyServiceTargetGender targetGender,
            boolean visible,
            Integer displayOrder,
            List<String> imageUrls
    ) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.price = price;
        this.targetGender = targetGender;
        this.visible = visible;
        this.displayOrder = displayOrder;
        replaceImageUrls(imageUrls);
    }

    private void replaceImageUrls(List<String> imageUrls) {
        List<String> next = imageUrls == null ? List.of() : imageUrls.stream()
                .filter(url -> url != null && !url.isBlank())
                .toList();
        this.imageUrls.clear();
        this.imageUrls.addAll(next);
    }
}
