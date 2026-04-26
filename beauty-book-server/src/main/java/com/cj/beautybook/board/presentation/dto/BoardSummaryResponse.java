package com.cj.beautybook.board.presentation.dto;

import com.cj.beautybook.board.domain.Board;
import com.cj.beautybook.board.domain.BoardStatus;

import java.time.Instant;

public record BoardSummaryResponse(
        Long id,
        String title,
        String authorName,
        BoardStatus status,
        boolean isPinned,
        boolean isAnswered,
        int viewCount,
        Instant createdAt
) {
    public static BoardSummaryResponse from(Board board) {
        return new BoardSummaryResponse(
                board.getId(),
                board.getTitle(),
                board.getAuthorName(),
                board.getStatus(),
                board.isPinned(),
                board.isAnswered(),
                board.getViewCount(),
                board.getCreatedAt()
        );
    }
}
