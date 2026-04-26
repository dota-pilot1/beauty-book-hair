package com.cj.beautybook.board.presentation.dto;

import com.cj.beautybook.board.domain.BoardStatus;
import jakarta.validation.constraints.NotBlank;

public record UpdateBoardPostRequest(
        @NotBlank String title,
        String content,
        BoardStatus status
) {}
