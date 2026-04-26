package com.cj.beautybook.board.infrastructure;

import com.cj.beautybook.board.domain.BoardComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BoardCommentRepository extends JpaRepository<BoardComment, Long> {
    @Query("SELECT c FROM BoardComment c WHERE c.board.id = :boardId AND c.deletedAt IS NULL ORDER BY c.createdAt ASC")
    List<BoardComment> findActiveByBoardId(@Param("boardId") Long boardId);
}
