package com.cj.beautybook.blog.infrastructure;

import com.cj.beautybook.blog.domain.BlogPost;
import com.cj.beautybook.blog.domain.BlogPostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {

    Page<BlogPost> findByStatus(BlogPostStatus status, Pageable pageable);

    Page<BlogPost> findByStatusAndCategorySlug(BlogPostStatus status, String categorySlug, Pageable pageable);

    @Query("SELECT DISTINCT p FROM BlogPost p JOIN p.tags t " +
           "WHERE p.status = :status AND t.slug = :tagSlug")
    Page<BlogPost> findByStatusAndTagSlug(
            @Param("status") BlogPostStatus status,
            @Param("tagSlug") String tagSlug,
            Pageable pageable);

    @EntityGraph(attributePaths = {"tags", "category"})
    Optional<BlogPost> findWithTagsBySlug(String slug);

    Optional<BlogPost> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
