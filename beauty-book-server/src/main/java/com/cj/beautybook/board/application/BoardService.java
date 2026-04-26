package com.cj.beautybook.board.application;

import com.cj.beautybook.board.domain.Board;
import com.cj.beautybook.board.domain.BoardComment;
import com.cj.beautybook.board.domain.BoardConfig;
import com.cj.beautybook.board.domain.BoardStatus;
import com.cj.beautybook.board.infrastructure.BoardCommentRepository;
import com.cj.beautybook.board.infrastructure.BoardConfigRepository;
import com.cj.beautybook.board.infrastructure.BoardRepository;
import com.cj.beautybook.board.presentation.dto.BoardConfigResponse;
import com.cj.beautybook.board.presentation.dto.BoardDetailResponse;
import com.cj.beautybook.board.presentation.dto.BoardSummaryResponse;
import com.cj.beautybook.board.presentation.dto.CommentResponse;
import com.cj.beautybook.board.presentation.dto.CreateBoardConfigRequest;
import com.cj.beautybook.board.presentation.dto.CreateBoardPostRequest;
import com.cj.beautybook.board.presentation.dto.CreateCommentRequest;
import com.cj.beautybook.board.presentation.dto.UpdateBoardPostRequest;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import com.cj.beautybook.menu.domain.Menu;
import com.cj.beautybook.menu.infrastructure.MenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardService {

    private static final String BOARD_PARENT_MENU_CODE = "BOARD";

    private final BoardConfigRepository boardConfigRepository;
    private final BoardRepository boardRepository;
    private final BoardCommentRepository boardCommentRepository;
    private final MenuRepository menuRepository;

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
        BoardConfigResponse saved = BoardConfigResponse.from(boardConfigRepository.save(config));
        syncMenuOnCreate(req.code(), req.displayName(), req.sortOrder());
        return saved;
    }

    @Transactional
    public void deleteConfig(Long id) {
        BoardConfig config = boardConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_CONFIG_NOT_FOUND));
        String menuCode = toMenuCode(config.getCode());
        menuRepository.findByCode(menuCode).ifPresent(menuRepository::delete);
        boardConfigRepository.delete(config);
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

    // ===== 댓글 =====

    @Transactional(readOnly = true)
    public List<CommentResponse> listComments(Long boardId) {
        return boardCommentRepository.findActiveByBoardId(boardId)
                .stream()
                .map(CommentResponse::from)
                .toList();
    }

    @Transactional
    public CommentResponse createComment(Long boardId, CreateCommentRequest req, Long authorId, String authorName) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_POST_NOT_FOUND));
        boolean isAdmin = false; // 필요 시 role 체크로 변경
        BoardComment comment = BoardComment.create(board, authorId, authorName, req.content(), isAdmin);
        return CommentResponse.from(boardCommentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long boardId, Long commentId, Long requesterId, boolean isAdmin) {
        BoardComment comment = boardCommentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_POST_NOT_FOUND));
        if (!isAdmin && !comment.getAuthorId().equals(requesterId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        comment.softDelete();
        boardCommentRepository.save(comment);
    }

    // ===== 내부 메뉴 동기화 =====

    private void syncMenuOnCreate(String boardCode, String displayName, int sortOrder) {
        Menu parent = menuRepository.findByCode(BOARD_PARENT_MENU_CODE)
                .orElseGet(() -> menuRepository.save(Menu.create(
                        BOARD_PARENT_MENU_CODE, null, "게시판", null,
                        null, null, false, null, null, true, 4
                )));

        String childCode = toMenuCode(boardCode);
        if (!menuRepository.existsByCode(childCode)) {
            menuRepository.save(Menu.create(
                    childCode, parent, displayName, null,
                    "/boards/" + boardCode, null, false,
                    null, null, true, sortOrder
            ));
        }
    }

    private String toMenuCode(String boardCode) {
        return BOARD_PARENT_MENU_CODE + "_" + boardCode.toUpperCase().replace("-", "_");
    }
}
