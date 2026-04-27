package com.cj.beautybook.config;

import com.cj.beautybook.beauty_service.domain.BeautyService;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceRepository;
import com.cj.beautybook.schedule.domain.BlockedTime;
import com.cj.beautybook.schedule.domain.BlockedTimeType;
import com.cj.beautybook.schedule.domain.BusinessHour;
import com.cj.beautybook.schedule.domain.StaffWorkingHour;
import com.cj.beautybook.schedule.infrastructure.BlockedTimeRepository;
import com.cj.beautybook.schedule.infrastructure.BusinessHourRepository;
import com.cj.beautybook.schedule.infrastructure.StaffWorkingHourRepository;
import com.cj.beautybook.staff.domain.Staff;
import com.cj.beautybook.staff.domain.StaffRole;
import com.cj.beautybook.staff.domain.StaffService;
import com.cj.beautybook.staff.infrastructure.StaffRepository;
import com.cj.beautybook.staff.infrastructure.StaffServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Component
@Order(9)
@RequiredArgsConstructor
public class ScheduleReservationSeeder implements ApplicationRunner {

    private static final ZoneId STORE_ZONE = ZoneId.of("Asia/Seoul");

    private final BusinessHourRepository businessHourRepository;
    private final StaffRepository staffRepository;
    private final StaffServiceRepository staffServiceRepository;
    private final StaffWorkingHourRepository staffWorkingHourRepository;
    private final BlockedTimeRepository blockedTimeRepository;
    private final BeautyServiceRepository beautyServiceRepository;

    private record StaffDef(String name, String introduction, int displayOrder) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedBusinessHours();

        List<Staff> staffList = seedStaff();
        List<BeautyService> services = beautyServiceRepository.findAll();
        if (services.isEmpty()) {
            log.info("Skip staff service seed: beauty services are empty");
            return;
        }

        seedStaffServices(staffList, services);
        seedStaffWorkingHours(staffList);
    }

    private void seedBusinessHours() {
        // 기본값: 모든 요일 영업 (10:00~20:00). 실제 휴무는 운영자가 관리자 화면에서 설정.
        for (DayOfWeek dayOfWeek : DayOfWeek.values()) {
            BusinessHour businessHour = businessHourRepository.findByDayOfWeek(dayOfWeek)
                    .orElseGet(() -> BusinessHour.create(dayOfWeek, LocalTime.of(10, 0), LocalTime.of(20, 0), false));
            // 기존에 닫혀있던 row는 덮어쓰지 않음 (운영자 설정 보존). 신규 row만 위 create로 영업.
            if (businessHour.getId() == null) {
                businessHourRepository.save(businessHour);
                log.info("Seeded business hour: {}", dayOfWeek);
            }
        }
    }

    private List<Staff> seedStaff() {
        List<StaffDef> defs = List.of(
                new StaffDef("하린", "레이어드 컷과 컬러 상담을 함께 제안합니다.", 0),
                new StaffDef("민서", "손상도에 맞춘 클리닉과 데일리 스타일링을 담당합니다.", 1)
        );

        return defs.stream()
                .map(def -> {
                    Staff staff = staffRepository.findByName(def.name())
                            .orElseGet(() -> {
                                Staff created = Staff.create(def.name(), StaffRole.DESIGNER, null, def.introduction(), true, def.displayOrder());
                                Staff saved = staffRepository.save(created);
                                log.info("Seeded staff: {}", def.name());
                                return saved;
                            });
                    return staff;
                })
                .toList();
    }

    private void seedStaffServices(List<Staff> staffList, List<BeautyService> services) {
        for (int staffIndex = 0; staffIndex < staffList.size(); staffIndex++) {
            Staff staff = staffList.get(staffIndex);
            for (int serviceIndex = 0; serviceIndex < services.size(); serviceIndex++) {
                BeautyService beautyService = services.get(serviceIndex);
                boolean active = staffIndex == 0 || serviceIndex < 2;

                StaffService staffService = staffServiceRepository
                        .findByStaffIdAndBeautyServiceId(staff.getId(), beautyService.getId())
                        .orElseGet(() -> StaffService.create(staff, beautyService, active));
                staffService.updateActive(active);
                staffServiceRepository.save(staffService);
            }
            log.info("Seeded staff services: {}", staff.getName());
        }
    }

    private void seedStaffWorkingHours(List<Staff> staffList) {
        for (Staff staff : staffList) {
            for (DayOfWeek dayOfWeek : DayOfWeek.values()) {
                boolean sunday = dayOfWeek == DayOfWeek.SUNDAY;
                StaffWorkingHour workingHour = staffWorkingHourRepository
                        .findByStaffIdAndDayOfWeek(staff.getId(), dayOfWeek)
                        .orElseGet(() -> StaffWorkingHour.create(staff, dayOfWeek, null, null, !sunday));

                workingHour.update(
                        sunday ? null : LocalTime.of(10, 0),
                        sunday ? null : LocalTime.of(19, 0),
                        !sunday
                );
                staffWorkingHourRepository.save(workingHour);
            }
            log.info("Seeded staff working hours: {}", staff.getName());
        }
    }

}
