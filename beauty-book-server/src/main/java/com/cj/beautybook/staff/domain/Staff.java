package com.cj.beautybook.staff.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "staff")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StaffRole role = StaffRole.DESIGNER;

    @Column(length = 1000)
    private String profileImageUrl;

    @Column(length = 500)
    private String introduction;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static Staff create(
            String name,
            StaffRole role,
            String profileImageUrl,
            String introduction,
            boolean active,
            Integer displayOrder
    ) {
        Staff staff = new Staff();
        staff.name = name;
        staff.role = role;
        staff.profileImageUrl = profileImageUrl;
        staff.introduction = introduction;
        staff.active = active;
        staff.displayOrder = displayOrder;
        return staff;
    }

    public void update(
            String name,
            StaffRole role,
            String profileImageUrl,
            String introduction,
            boolean active,
            Integer displayOrder
    ) {
        this.name = name;
        this.role = role;
        this.profileImageUrl = profileImageUrl;
        this.introduction = introduction;
        this.active = active;
        this.displayOrder = displayOrder;
    }
}
