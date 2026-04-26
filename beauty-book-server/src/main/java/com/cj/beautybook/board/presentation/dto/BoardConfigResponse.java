package com.cj.beautybook.board.presentation.dto;

import com.cj.beautybook.board.domain.BoardConfig;
import com.cj.beautybook.board.domain.BoardKind;

public record BoardConfigResponse(
        Long id,
        String code,
        BoardKind kind,
        String displayName,
        String description,
        boolean allowCustomerWrite,
        boolean allowComment,
        boolean isActive,
        int sortOrder
) {
    public static BoardConfigResponse from(BoardConfig config) {
        return new BoardConfigResponse(
                config.getId(),
                config.getCode(),
                config.getKind(),
                config.getDisplayName(),
                config.getDescription(),
                config.isAllowCustomerWrite(),
                config.isAllowComment(),
                config.isActive(),
                config.getSortOrder()
        );
    }
}
