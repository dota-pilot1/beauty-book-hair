package com.cj.beautybook.board.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "boards")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_config_id", nullable = false)
    private BoardConfig boardConfig;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column
    private Long authorId;

    @Column(length = 200)
    private String authorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BoardStatus status = BoardStatus.PUBLISHED;

    @Column(nullable = false)
    private boolean isPinned = false;

    @Column
    private Integer pinnedOrder;

    @Column(nullable = false)
    private boolean isAnswered = false;

    @Column(nullable = false)
    private int viewCount = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    @Column
    private Instant deletedAt;

    public static Board create(
            BoardConfig boardConfig,
            String title,
            String content,
            Long authorId,
            String authorName,
            BoardStatus status
    ) {
        Board board = new Board();
        board.boardConfig = boardConfig;
        board.title = title;
        board.content = content;
        board.authorId = authorId;
        board.authorName = authorName;
        board.status = status != null ? status : BoardStatus.PUBLISHED;
        board.isPinned = false;
        board.isAnswered = false;
        board.viewCount = 0;
        return board;
    }

    public void update(String title, String content, BoardStatus status) {
        this.title = title;
        this.content = content;
        if (status != null) this.status = status;
    }

    public void pin(int order) {
        this.isPinned = true;
        this.pinnedOrder = order;
    }

    public void unpin() {
        this.isPinned = false;
        this.pinnedOrder = null;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }

    public void incrementView() {
        this.viewCount++;
    }

    public void markAnswered() {
        this.isAnswered = true;
    }
}
