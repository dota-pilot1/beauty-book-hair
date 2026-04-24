package com.cj.beautybook.staff.infrastructure;

import com.cj.beautybook.staff.domain.StaffService;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaffServiceRepository extends JpaRepository<StaffService, Long> {
    @EntityGraph(attributePaths = {"staff", "beautyService"})
    Optional<StaffService> findByStaffIdAndBeautyServiceId(Long staffId, Long beautyServiceId);

    @EntityGraph(attributePaths = {"staff", "beautyService"})
    List<StaffService> findByStaffId(Long staffId);

    @EntityGraph(attributePaths = {"staff", "beautyService"})
    List<StaffService> findByBeautyServiceIdAndActiveTrue(Long beautyServiceId);

    boolean existsByStaffIdAndBeautyServiceIdAndActiveTrue(Long staffId, Long beautyServiceId);
}
