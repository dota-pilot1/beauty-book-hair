package com.cj.beautybook.blog.infrastructure;

import com.cj.beautybook.blog.domain.BlogTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BlogTagRepository extends JpaRepository<BlogTag, Long> {
    Optional<BlogTag> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsByName(String name);
    List<BlogTag> findAllByIdIn(Collection<Long> ids);
}
