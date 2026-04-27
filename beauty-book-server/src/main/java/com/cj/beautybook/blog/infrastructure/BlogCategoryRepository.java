package com.cj.beautybook.blog.infrastructure;

import com.cj.beautybook.blog.domain.BlogCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlogCategoryRepository extends JpaRepository<BlogCategory, Long> {
    List<BlogCategory> findAllByOrderByDisplayOrderAsc();
    Optional<BlogCategory> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsByName(String name);
}
