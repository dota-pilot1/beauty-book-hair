package com.cj.beautybook.board.presentation.dto;

import com.cj.beautybook.board.domain.Board;
import com.cj.beautybook.board.domain.BoardStatus;

import java.time.Instant;

public record BoardDetailResponse(
        Long id,
        Long boardConfigId,
        String boardConfigCode,
        String title,
        String content,
        Long authorId,
        String authorName,
        BoardStatus status,
        boolean isPinned,
        boolean isAnswered,
        int viewCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static BoardDetailResponse from(Board board) {
        return new BoardDetailResponse(
                board.getId(),
                board.getBoardConfig().getId(),
                board.getBoardConfig().getCode(),
                board.getTitle(),
                board.getContent(),
                board.getAuthorId(),
                board.getAuthorName(),
                board.getStatus(),
                board.isPinned(),
                board.isAnswered(),
                board.getViewCount(),
                board.getCreatedAt(),
                board.getUpdatedAt()
        );
    }
}
