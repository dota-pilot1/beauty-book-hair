package com.cj.beautybook.board.presentation.dto;

import com.cj.beautybook.board.domain.BoardComment;
import java.time.Instant;

public record CommentResponse(
        Long id,
        Long boardId,
        Long authorId,
        String authorName,
        String content,
        boolean isAdminReply,
        Instant createdAt
) {
    public static CommentResponse from(BoardComment c) {
        return new CommentResponse(
                c.getId(),
                c.getBoard().getId(),
                c.getAuthorId(),
                c.getAuthorName(),
                c.getContent(),
                c.isAdminReply(),
                c.getCreatedAt()
        );
    }
}
