package com.cj.beautybook.board.domain;

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
@Table(name = "board_configs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BoardKind kind;

    @Column(nullable = false, length = 200)
    private String displayName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean allowCustomerWrite = false;

    @Column(nullable = false)
    private boolean allowComment = false;

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false)
    private int sortOrder = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static BoardConfig create(
            String code,
            BoardKind kind,
            String displayName,
            String description,
            boolean allowCustomerWrite,
            boolean allowComment,
            int sortOrder
    ) {
        BoardConfig config = new BoardConfig();
        config.code = code;
        config.kind = kind;
        config.displayName = displayName;
        config.description = description;
        config.allowCustomerWrite = allowCustomerWrite;
        config.allowComment = allowComment;
        config.isActive = true;
        config.sortOrder = sortOrder;
        return config;
    }
}
