package com.cj.beautybook.board.infrastructure;

import com.cj.beautybook.board.domain.Board;
import com.cj.beautybook.board.domain.BoardStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardRepository extends JpaRepository<Board, Long> {

    Page<Board> findByBoardConfigCodeAndStatus(String code, BoardStatus status, Pageable pageable);

    Page<Board> findByBoardConfigCode(String code, Pageable pageable);
}
