package com.cj.beautybook.blog.application;

import com.cj.beautybook.blog.domain.BlogCategory;
import com.cj.beautybook.blog.domain.BlogPost;
import com.cj.beautybook.blog.domain.BlogPostStatus;
import com.cj.beautybook.blog.domain.BlogTag;
import com.cj.beautybook.blog.infrastructure.BlogCategoryRepository;
import com.cj.beautybook.blog.infrastructure.BlogPostRepository;
import com.cj.beautybook.blog.infrastructure.BlogTagRepository;
import com.cj.beautybook.blog.presentation.dto.BlogCategoryResponse;
import com.cj.beautybook.blog.presentation.dto.BlogPostDetailResponse;
import com.cj.beautybook.blog.presentation.dto.BlogPostSummaryResponse;
import com.cj.beautybook.blog.presentation.dto.BlogTagResponse;
import com.cj.beautybook.blog.presentation.dto.CreateBlogCategoryRequest;
import com.cj.beautybook.blog.presentation.dto.CreateBlogPostRequest;
import com.cj.beautybook.blog.presentation.dto.CreateBlogTagRequest;
import com.cj.beautybook.blog.presentation.dto.UpdateBlogPostRequest;
import com.cj.beautybook.common.exception.BusinessException;
import com.cj.beautybook.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BlogService {

    private final BlogPostRepository blogPostRepository;
    private final BlogTagRepository blogTagRepository;
    private final BlogCategoryRepository blogCategoryRepository;

    // ── 공개 API ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<BlogPostSummaryResponse> listPublished(String categorySlug, String tagSlug, Pageable pageable) {
        if (categorySlug != null && !categorySlug.isBlank()) {
            return blogPostRepository
                    .findByStatusAndCategorySlug(BlogPostStatus.PUBLISHED, categorySlug, pageable)
                    .map(BlogPostSummaryResponse::from);
        }
        if (tagSlug != null && !tagSlug.isBlank()) {
            return blogPostRepository
                    .findByStatusAndTagSlug(BlogPostStatus.PUBLISHED, tagSlug, pageable)
                    .map(BlogPostSummaryResponse::from);
        }
        return blogPostRepository
                .findByStatus(BlogPostStatus.PUBLISHED, pageable)
                .map(BlogPostSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public List<BlogCategoryResponse> listCategories() {
        return blogCategoryRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(BlogCategoryResponse::from).toList();
    }

    @Transactional
    public BlogPostDetailResponse getBySlug(String slug) {
        BlogPost post = blogPostRepository.findWithTagsBySlug(slug)
                .orElseThrow(() -> new BusinessException(ErrorCode.BLOG_POST_NOT_FOUND));
        post.incrementView();
        return BlogPostDetailResponse.from(post);
    }

    @Transactional(readOnly = true)
    public List<BlogTagResponse> listTags() {
        return blogTagRepository.findAll().stream()
                .map(BlogTagResponse::from)
                .toList();
    }

    // ── 어드민 API ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<BlogPostSummaryResponse> adminListAll(Pageable pageable) {
        return blogPostRepository.findAll(pageable)
                .map(BlogPostSummaryResponse::from);
    }

    @Transactional
    public BlogPostDetailResponse createPost(CreateBlogPostRequest req) {
        if (blogPostRepository.existsBySlug(req.slug())) {
            throw new BusinessException(ErrorCode.BLOG_POST_SLUG_DUPLICATE);
        }
        Set<BlogTag> tags = resolveTagIds(req.tagIds());
        BlogCategory category = resolveCategory(req.categoryId());
        BlogPost post = BlogPost.create(
                req.slug(), req.title(), req.content(), req.summary(),
                req.coverImageUrl(), req.authorStaffId(), req.authorName(),
                req.status(), req.isPinned(), category
        );
        post.setTags(tags);
        return BlogPostDetailResponse.from(blogPostRepository.save(post));
    }

    @Transactional
    public BlogPostDetailResponse updatePost(Long id, UpdateBlogPostRequest req) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BLOG_POST_NOT_FOUND));
        BlogCategory category = req.categoryId() != null
                ? resolveCategory(req.categoryId())
                : post.getCategory();
        post.update(
                req.title() != null ? req.title() : post.getTitle(),
                req.content() != null ? req.content() : post.getContent(),
                req.summary() != null ? req.summary() : post.getSummary(),
                req.coverImageUrl() != null ? req.coverImageUrl() : post.getCoverImageUrl(),
                req.authorStaffId() != null ? req.authorStaffId() : post.getAuthorStaffId(),
                req.authorName() != null ? req.authorName() : post.getAuthorName(),
                req.status(),
                req.isPinned() != null ? req.isPinned() : post.isPinned(),
                category
        );
        if (req.tagIds() != null) {
            post.setTags(resolveTagIds(req.tagIds()));
        }
        return BlogPostDetailResponse.from(blogPostRepository.save(post));
    }

    @Transactional
    public void deletePost(Long id) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BLOG_POST_NOT_FOUND));
        post.softDelete();
    }

    @Transactional
    public BlogTagResponse createTag(CreateBlogTagRequest req) {
        if (blogTagRepository.existsByName(req.name()) || blogTagRepository.existsBySlug(req.slug())) {
            throw new BusinessException(ErrorCode.BLOG_TAG_DUPLICATE);
        }
        return BlogTagResponse.from(blogTagRepository.save(BlogTag.create(req.name(), req.slug())));
    }

    @Transactional
    public void deleteTag(Long id) {
        if (!blogTagRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.BLOG_TAG_NOT_FOUND);
        }
        blogTagRepository.deleteById(id);
    }

    public String generateSlug(String title) {
        String base = title.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9가-힣]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        if (base.isBlank()) base = "post";
        if (!blogPostRepository.existsBySlug(base)) return base;
        int i = 1;
        while (blogPostRepository.existsBySlug(base + "-" + i)) i++;
        return base + "-" + i;
    }

    @Transactional
    public BlogCategoryResponse createCategory(CreateBlogCategoryRequest req) {
        if (blogCategoryRepository.existsBySlug(req.slug()) || blogCategoryRepository.existsByName(req.name())) {
            throw new BusinessException(ErrorCode.BLOG_CATEGORY_DUPLICATE);
        }
        return BlogCategoryResponse.from(
                blogCategoryRepository.save(BlogCategory.create(req.name(), req.slug(), req.displayOrder()))
        );
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!blogCategoryRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.BLOG_CATEGORY_NOT_FOUND);
        }
        blogCategoryRepository.deleteById(id);
    }

    private Set<BlogTag> resolveTagIds(List<Long> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) return new LinkedHashSet<>();
        return new LinkedHashSet<>(blogTagRepository.findAllByIdIn(tagIds));
    }

    private BlogCategory resolveCategory(Long categoryId) {
        if (categoryId == null) return null;
        return blogCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BLOG_CATEGORY_NOT_FOUND));
    }
}
