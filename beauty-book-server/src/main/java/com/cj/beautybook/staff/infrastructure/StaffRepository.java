package com.cj.beautybook.staff.infrastructure;

import com.cj.beautybook.staff.domain.Staff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByName(String name);

    List<Staff> findAllByOrderByDisplayOrderAscNameAsc();

    List<Staff> findByActiveTrueOrderByDisplayOrderAscNameAsc();
}
