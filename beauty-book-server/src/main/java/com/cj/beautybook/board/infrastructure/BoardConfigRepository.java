package com.cj.beautybook.board.infrastructure;

import com.cj.beautybook.board.domain.BoardConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardConfigRepository extends JpaRepository<BoardConfig, Long> {

    List<BoardConfig> findByIsActiveTrueOrderBySortOrderAsc();

    Optional<BoardConfig> findByCode(String code);

    boolean existsByCode(String code);
}
