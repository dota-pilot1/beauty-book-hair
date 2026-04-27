package com.cj.beautybook.blog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "blog_posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BlogPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(length = 1000)
    private String coverImageUrl;

    @Column
    private Long authorStaffId;

    @Column(length = 100)
    private String authorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BlogPostStatus status = BlogPostStatus.DRAFT;

    @Column(nullable = false)
    private int viewCount = 0;

    @Column(nullable = false)
    private boolean isPinned = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private BlogCategory category;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "blog_post_tags",
            joinColumns = @JoinColumn(name = "blog_post_id"),
            inverseJoinColumns = @JoinColumn(name = "blog_tag_id")
    )
    private Set<BlogTag> tags = new LinkedHashSet<>();

    @Column
    private Instant publishedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    @Column
    private Instant deletedAt;

    public static BlogPost create(
            String slug,
            String title,
            String content,
            String summary,
            String coverImageUrl,
            Long authorStaffId,
            String authorName,
            BlogPostStatus status,
            boolean isPinned,
            BlogCategory category
    ) {
        BlogPost post = new BlogPost();
        post.slug = slug;
        post.title = title;
        post.content = content;
        post.summary = summary;
        post.coverImageUrl = coverImageUrl;
        post.authorStaffId = authorStaffId;
        post.authorName = authorName;
        post.status = status != null ? status : BlogPostStatus.DRAFT;
        post.isPinned = isPinned;
        post.category = category;
        post.viewCount = 0;
        if (post.status == BlogPostStatus.PUBLISHED) {
            post.publishedAt = Instant.now();
        }
        return post;
    }

    public void update(
            String title,
            String content,
            String summary,
            String coverImageUrl,
            Long authorStaffId,
            String authorName,
            BlogPostStatus status,
            boolean isPinned,
            BlogCategory category
    ) {
        this.title = title;
        this.content = content;
        this.summary = summary;
        this.coverImageUrl = coverImageUrl;
        this.authorStaffId = authorStaffId;
        this.authorName = authorName;
        this.isPinned = isPinned;
        this.category = category;
        if (status != null) {
            if (this.status != BlogPostStatus.PUBLISHED && status == BlogPostStatus.PUBLISHED) {
                this.publishedAt = Instant.now();
            }
            this.status = status;
        }
    }

    public void setTags(Set<BlogTag> tags) {
        this.tags = tags != null ? tags : new LinkedHashSet<>();
    }

    public void incrementView() {
        this.viewCount++;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }
}
