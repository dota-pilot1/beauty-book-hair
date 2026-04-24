package com.cj.beautybook.beauty_service.infrastructure;

import com.cj.beautybook.beauty_service.domain.BeautyService;
import com.cj.beautybook.beauty_service.domain.BeautyServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BeautyServiceRepository extends JpaRepository<BeautyService, Long> {
    boolean existsByCode(String code);
    Optional<BeautyService> findByCode(String code);
    boolean existsByCategory(BeautyServiceCategory category);

    @Query("select s from BeautyService s join fetch s.category order by s.displayOrder asc, s.id asc")
    List<BeautyService> findAllWithCategory();

    @Query("select s from BeautyService s join fetch s.category where s.id = :id")
    Optional<BeautyService> findByIdWithCategory(@Param("id") Long id);
}
