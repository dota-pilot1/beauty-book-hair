package com.cj.beautybook.board.presentation;

import com.cj.beautybook.auth.security.UserPrincipal;
import com.cj.beautybook.board.application.BoardService;
import com.cj.beautybook.board.presentation.dto.BoardConfigResponse;
import com.cj.beautybook.board.presentation.dto.BoardDetailResponse;
import com.cj.beautybook.board.presentation.dto.BoardSummaryResponse;
import com.cj.beautybook.board.presentation.dto.CommentResponse;
import com.cj.beautybook.board.presentation.dto.CreateBoardConfigRequest;
import com.cj.beautybook.board.presentation.dto.CreateBoardPostRequest;
import com.cj.beautybook.board.presentation.dto.CreateCommentRequest;
import com.cj.beautybook.board.presentation.dto.UpdateBoardPostRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "게시판")
@RestController
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    // ===== 공개 API =====

    @GetMapping("/api/boards/configs")
    public List<BoardConfigResponse> listConfigs() {
        return boardService.listActiveConfigs();
    }

    @GetMapping("/api/boards/{code}")
    public Page<BoardSummaryResponse> listPosts(
            @PathVariable String code,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("isPinned"), Sort.Order.desc("createdAt")));
        return boardService.listPosts(code, pageable);
    }

    @GetMapping("/api/boards/{code}/{id}")
    public BoardDetailResponse getPost(
            @PathVariable String code,
            @PathVariable Long id
    ) {
        return boardService.getPost(id);
    }

    // ===== 관리자 API =====

    @GetMapping("/api/admin/board-configs")
    public List<BoardConfigResponse> adminListConfigs() {
        return boardService.listAllConfigs();
    }

    @PostMapping("/api/admin/board-configs")
    @ResponseStatus(HttpStatus.CREATED)
    public BoardConfigResponse adminCreateConfig(
            @RequestBody @Valid CreateBoardConfigRequest req
    ) {
        return boardService.createConfig(req);
    }

    @DeleteMapping("/api/admin/board-configs/{id}")
    public ResponseEntity<Void> adminDeleteConfig(@PathVariable Long id) {
        boardService.deleteConfig(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/admin/boards/{code}")
    public Page<BoardSummaryResponse> adminListPosts(
            @PathVariable String code,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("isPinned"), Sort.Order.desc("createdAt")));
        return boardService.listAllPosts(code, pageable);
    }

    @PostMapping("/api/admin/boards/{code}")
    @ResponseStatus(HttpStatus.CREATED)
    public BoardDetailResponse adminCreatePost(
            @PathVariable String code,
            @RequestBody @Valid CreateBoardPostRequest req,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long authorId = principal != null ? principal.getId() : null;
        String authorName = principal != null ? principal.getUsername() : null;
        return boardService.createPost(code, req, authorId, authorName);
    }

    @PatchMapping("/api/admin/boards/{id}")
    public BoardDetailResponse adminUpdatePost(
            @PathVariable Long id,
            @RequestBody UpdateBoardPostRequest req
    ) {
        return boardService.updatePost(id, req);
    }

    @DeleteMapping("/api/admin/boards/{id}")
    public ResponseEntity<Void> adminDeletePost(@PathVariable Long id) {
        boardService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/admin/boards/{id}/pin")
    public ResponseEntity<Void> adminPinPost(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int order
    ) {
        boardService.pinPost(id, order);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/api/admin/boards/{id}/pin")
    public ResponseEntity<Void> adminUnpinPost(@PathVariable Long id) {
        boardService.unpinPost(id);
        return ResponseEntity.noContent().build();
    }

    // ===== 댓글 API =====

    @GetMapping("/api/boards/{boardId}/comments")
    public List<CommentResponse> listComments(@PathVariable Long boardId) {
        return boardService.listComments(boardId);
    }

    @PostMapping("/api/boards/{boardId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse createComment(
            @PathVariable Long boardId,
            @RequestBody @Valid CreateCommentRequest req,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) throw new com.cj.beautybook.common.exception.BusinessException(com.cj.beautybook.common.exception.ErrorCode.INVALID_TOKEN);
        return boardService.createComment(boardId, req, principal.getId(), principal.getUsername());
    }

    @DeleteMapping("/api/boards/{boardId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long boardId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) throw new com.cj.beautybook.common.exception.BusinessException(com.cj.beautybook.common.exception.ErrorCode.INVALID_TOKEN);
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boardService.deleteComment(boardId, commentId, principal.getId(), isAdmin);
        return ResponseEntity.noContent().build();
    }
}
