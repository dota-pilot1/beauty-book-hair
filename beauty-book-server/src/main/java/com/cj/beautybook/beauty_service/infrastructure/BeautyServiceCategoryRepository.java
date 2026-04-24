package com.cj.beautybook.beauty_service.infrastructure;

import com.cj.beautybook.beauty_service.domain.BeautyServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BeautyServiceCategoryRepository extends JpaRepository<BeautyServiceCategory, Long> {
    boolean existsByCode(String code);
    Optional<BeautyServiceCategory> findByCode(String code);
}
