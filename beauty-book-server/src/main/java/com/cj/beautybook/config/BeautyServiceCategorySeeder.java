package com.cj.beautybook.config;

import com.cj.beautybook.beauty_service.domain.BeautyServiceCategory;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Order(6)
@RequiredArgsConstructor
public class BeautyServiceCategorySeeder implements ApplicationRunner {

    private final BeautyServiceCategoryRepository categoryRepository;

    private record Def(
            String code,
            String name,
            String description,
            boolean visible,
            int displayOrder
    ) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Def> defs = List.of(
                new Def("CUT", "컷", "기본 컷, 레이어드 컷 등 컷 시술", true, 0),
                new Def("PERM", "펌", "볼륨펌, 셋팅펌 등 펌 시술", true, 1),
                new Def("COLOR", "염색", "뿌리염색, 전체염색 등 컬러 시술", true, 2),
                new Def("CLINIC", "클리닉", "케어 및 손상 회복 중심 시술", true, 3),
                new Def("STYLING", "스타일링", "드라이, 스타일링, 업스타일", true, 4)
        );

        for (Def def : defs) {
            BeautyServiceCategory category = categoryRepository.findByCode(def.code())
                    .orElseGet(() -> BeautyServiceCategory.create(
                            def.code(),
                            def.name(),
                            def.description(),
                            def.visible(),
                            def.displayOrder()
                    ));
            category.update(def.name(), def.description(), def.visible(), def.displayOrder());
            categoryRepository.save(category);
            log.info("Seeded beauty service category: {}", def.code());
        }
    }
}
