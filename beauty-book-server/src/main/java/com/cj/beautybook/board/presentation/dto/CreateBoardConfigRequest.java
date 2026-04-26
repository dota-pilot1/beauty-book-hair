package com.cj.beautybook.board.presentation.dto;

import com.cj.beautybook.board.domain.BoardKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateBoardConfigRequest(
        @NotBlank String code,
        @NotNull BoardKind kind,
        @NotBlank String displayName,
        String description,
        boolean allowCustomerWrite,
        boolean allowComment,
        int sortOrder
) {}
