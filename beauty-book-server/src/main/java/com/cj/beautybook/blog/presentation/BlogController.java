package com.cj.beautybook.blog.presentation;

import com.cj.beautybook.blog.application.BlogService;
import com.cj.beautybook.blog.presentation.dto.BlogCategoryResponse;
import com.cj.beautybook.blog.presentation.dto.BlogPostDetailResponse;
import com.cj.beautybook.blog.presentation.dto.BlogPostSummaryResponse;
import com.cj.beautybook.blog.presentation.dto.BlogTagResponse;
import com.cj.beautybook.blog.presentation.dto.CreateBlogCategoryRequest;
import com.cj.beautybook.blog.presentation.dto.CreateBlogPostRequest;
import com.cj.beautybook.blog.presentation.dto.CreateBlogTagRequest;
import com.cj.beautybook.blog.presentation.dto.UpdateBlogPostRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import java.util.Map;

@Tag(name = "블로그")
@RestController
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;

    // ── 공개 API ────────────────────────────────────────────────────────────

    @GetMapping("/api/blog/posts")
    public Page<BlogPostSummaryResponse> listPublished(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "false") boolean popular
    ) {
        Pageable pageable = popular
                ? PageRequest.of(page, size, Sort.by(Sort.Order.desc("viewCount")))
                : PageRequest.of(page, size, Sort.by(Sort.Order.desc("isPinned"), Sort.Order.desc("publishedAt")));
        return blogService.listPublished(category, tag, pageable);
    }

    @GetMapping("/api/blog/posts/{slug}")
    public BlogPostDetailResponse getBySlug(@PathVariable String slug) {
        return blogService.getBySlug(slug);
    }

    @GetMapping("/api/blog/tags")
    public List<BlogTagResponse> listTags() {
        return blogService.listTags();
    }

    @GetMapping("/api/blog/categories")
    public List<BlogCategoryResponse> listCategories() {
        return blogService.listCategories();
    }

    // ── 어드민 API (ADMIN + MANAGER 접근 가능) ─────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @GetMapping("/api/admin/blog/posts")
    public Page<BlogPostSummaryResponse> adminListAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        return blogService.adminListAll(pageable);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @GetMapping("/api/admin/blog/posts/suggest-slug")
    public Map<String, String> suggestSlug(@RequestParam String title) {
        return Map.of("slug", blogService.generateSlug(title));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PostMapping("/api/admin/blog/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public BlogPostDetailResponse adminCreate(
            @RequestBody @Valid CreateBlogPostRequest req
    ) {
        return blogService.createPost(req);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PatchMapping("/api/admin/blog/posts/{id}")
    public BlogPostDetailResponse adminUpdate(
            @PathVariable Long id,
            @RequestBody UpdateBlogPostRequest req
    ) {
        return blogService.updatePost(id, req);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/blog/posts/{id}")
    public ResponseEntity<Void> adminDelete(@PathVariable Long id) {
        blogService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/blog/tags")
    @ResponseStatus(HttpStatus.CREATED)
    public BlogTagResponse adminCreateTag(@RequestBody @Valid CreateBlogTagRequest req) {
        return blogService.createTag(req);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/blog/tags/{id}")
    public ResponseEntity<Void> adminDeleteTag(@PathVariable Long id) {
        blogService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/blog/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public BlogCategoryResponse adminCreateCategory(@RequestBody @Valid CreateBlogCategoryRequest req) {
        return blogService.createCategory(req);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/admin/blog/categories/{id}")
    public ResponseEntity<Void> adminDeleteCategory(@PathVariable Long id) {
        blogService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
