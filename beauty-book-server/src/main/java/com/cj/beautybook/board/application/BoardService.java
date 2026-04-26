package com.cj.beautybook.board.application;

import com.cj.beautybook.board.domain.Board;
import com.cj.beautybook.board.domain.BoardConfig;
import com.cj.beautybook.board.domain.BoardStatus;
import com.cj.beautybook.board.infrastructure.BoardConfigRepository;
import com.cj.beautybook.board.infrastructure.BoardRepository;
import com.cj.beautybook.board.presentation.dto.BoardConfigResponse;
import com.cj.beautybook.board.presentation.dto.BoardDetailResponse;
import com.cj.beautybook.board.presentation.dto.BoardSummaryResponse;
import com.cj.beautybook.board.presentation.dto.CreateBoardConfigRequest;
import com.cj.beautybook.board.presentation.dto.CreateBoardPostRequest;
import com.cj.beautybook.board.presentation.dto.UpdateBoardPostRequest;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardConfigRepository boardConfigRepository;
    private final BoardRepository boardRepository;

    @Transactional(readOnly = true)
    public List<BoardConfigResponse> listActiveConfigs() {
        return boardConfigRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(BoardConfigResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BoardConfigResponse> listAllConfigs() {
        return boardConfigRepository.findAll()
                .stream()
                .map(BoardConfigResponse::from)
                .toList();
    }

    @Transactional
    public BoardConfigResponse createConfig(CreateBoardConfigRequest req) {
        if (boardConfigRepository.existsByCode(req.code())) {
            throw new BusinessException(ErrorCode.BOARD_CONFIG_CODE_DUPLICATE);
        }
        BoardConfig config = BoardConfig.create(
                req.code(),
                req.kind(),
                req.displayName(),
                req.description(),
                req.allowCustomerWrite(),
                req.allowComment(),
                req.sortOrder()
        );
        return BoardConfigResponse.from(boardConfigRepository.save(config));
    }

    @Transactional
    public BoardDetailResponse getPost(Long id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_POST_NOT_FOUND));
        board.incrementView();
        boardRepository.save(board);
        return BoardDetailResponse.from(board);
    }

    @Transactional(readOnly = true)
    public Page<BoardSummaryResponse> listPosts(String code, Pageable pageable) {
        return boardRepository.findByBoardConfigCodeAndStatus(code, BoardStatus.PUBLISHED, pageable)
                .map(BoardSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<BoardSummaryResponse> listAllPosts(String code, Pageable pageable) {
        return boardRepository.findByBoardConfigCode(code, pageable)
                .map(BoardSummaryResponse::from);
    }

    @Transactional
    public BoardDetailResponse createPost(String code, CreateBoardPostRequest req, Long authorId, String authorName) {
        BoardConfig config = boardConfigRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_CONFIG_NOT_FOUND));
        BoardStatus status = req.status() != null ? req.status() : BoardStatus.PUBLISHED;
        Board board = Board.create(config, req.title(), req.content(), authorId, authorName, status);
        return BoardDetailResponse.from(boardRepository.save(board));
    }

    @Transactional
    public BoardDetailResponse updatePost(Long id, UpdateBoardPostRequest req) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_POST_NOT_FOUND));
        board.update(req.title(), req.content(), req.status());
        return BoardDetailResponse.from(boardRepository.save(board));
    }

    @Transactional
    public void deletePost(Long id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_POST_NOT_FOUND));
        board.softDelete();
        boardRepository.save(board);
    }

    @Transactional
    public void pinPost(Long id, int order) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_POST_NOT_FOUND));
        board.pin(order);
        boardRepository.save(board);
    }

    @Transactional
    public void unpinPost(Long id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_POST_NOT_FOUND));
        board.unpin();
        boardRepository.save(board);
    }
}
