package com.cj.beautybook.config;

import com.cj.beautybook.beauty_service.domain.BeautyService;
import com.cj.beautybook.beauty_service.domain.BeautyServiceCategory;
import com.cj.beautybook.beauty_service.domain.BeautyServiceTargetGender;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceCategoryRepository;
import com.cj.beautybook.beauty_service.infrastructure.BeautyServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@Order(8)
@RequiredArgsConstructor
public class BeautyServiceSeeder implements ApplicationRunner {

    private final BeautyServiceRepository beautyServiceRepository;
    private final BeautyServiceCategoryRepository categoryRepository;

    private record Def(
            String code,
            String name,
            String categoryCode,
            String description,
            int durationMinutes,
            BigDecimal price,
            BeautyServiceTargetGender targetGender,
            int displayOrder
    ) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Def> defs = List.of(
                // ── CUT ──────────────────────────────────────────────────────────
                new Def("WOMENS_CUT",       "여자 커트",       "CUT", "기본 여성 커트 (샴푸 포함)", 50, new BigDecimal("25000"), BeautyServiceTargetGender.WOMEN, 0),
                new Def("MENS_CUT",         "남자 커트",       "CUT", "기본 남성 커트 (샴푸 포함)", 30, new BigDecimal("15000"), BeautyServiceTargetGender.MEN,   1),
                new Def("TWO_BLOCK",        "투블럭",          "CUT", "옆머리를 짧게 밀어 스타일 강조", 40, new BigDecimal("20000"), BeautyServiceTargetGender.MEN,   2),
                new Def("LAYERED_CUT",      "레이어드 컷",     "CUT", "볼륨감 있는 레이어 스타일 컷", 60, new BigDecimal("55000"), BeautyServiceTargetGender.ALL,    3),
                new Def("SHORT_BOB",        "단발 커트",       "CUT", "턱선 아래 단정한 단발 스타일", 50, new BigDecimal("30000"), BeautyServiceTargetGender.WOMEN, 4),
                new Def("WOLF_CUT",         "울프 컷",         "CUT", "자연스러운 웨이브와 레이어 믹스", 60, new BigDecimal("45000"), BeautyServiceTargetGender.ALL,    5),
                new Def("HUSH_CUT",         "허쉬 컷",         "CUT", "앞머리와 사이드가 자연스럽게 연결되는 컷", 60, new BigDecimal("50000"), BeautyServiceTargetGender.WOMEN, 6),
                new Def("TRIM",             "다듬기",          "CUT", "기장 유지 및 끝손질", 20, new BigDecimal("10000"), BeautyServiceTargetGender.ALL,    7),
                // ── PERM ─────────────────────────────────────────────────────────
                new Def("VOLUME_PERM",      "볼륨 펌",         "PERM", "뿌리 볼륨을 살려주는 웨이브 펌", 120, new BigDecimal("110000"), BeautyServiceTargetGender.ALL,    0),
                new Def("MAGIC_STRAIGHT",   "매직 스트레이트", "PERM", "열 교정으로 모발을 완전히 펴주는 시술", 150, new BigDecimal("130000"), BeautyServiceTargetGender.ALL,    1),
                new Def("BODY_PERM",        "바디 펌",         "PERM", "자연스러운 S-라인 웨이브", 120, new BigDecimal("100000"), BeautyServiceTargetGender.ALL,    2),
                new Def("DIGITAL_PERM",     "디지털 펌",       "PERM", "열기구를 이용한 지속력 높은 웨이브", 150, new BigDecimal("140000"), BeautyServiceTargetGender.ALL,    3),
                new Def("MENS_PERM",        "남자 펌",         "PERM", "남성 전용 자연스러운 웨이브 펌", 90, new BigDecimal("80000"), BeautyServiceTargetGender.MEN,   4),
                new Def("SETTING_PERM",     "셋팅 펌",         "PERM", "원하는 형태로 고정하는 핀컬 셋팅 펌", 130, new BigDecimal("120000"), BeautyServiceTargetGender.ALL,    5),
                // ── COLOR ────────────────────────────────────────────────────────
                new Def("ROOT_COLOR",       "뿌리 염색",       "COLOR", "자란 부분을 자연스럽게 보정하는 염색", 90, new BigDecimal("50000"), BeautyServiceTargetGender.ALL,    0),
                new Def("FULL_COLOR",       "전체 염색",       "COLOR", "모발 전체 컬러 변경", 100, new BigDecimal("88000"), BeautyServiceTargetGender.ALL,    1),
                new Def("HIGHLIGHT",        "하이라이트",      "COLOR", "입체감 있는 밝은 톤 스트라이프", 120, new BigDecimal("120000"), BeautyServiceTargetGender.ALL,    2),
                new Def("BALAYAGE",         "발레아쥬",        "COLOR", "자연스러운 그라데이션 탈색 컬러", 150, new BigDecimal("160000"), BeautyServiceTargetGender.ALL,    3),
                new Def("BLEACH",           "탈색",            "COLOR", "모발 밝기 레벨 업 탈색 시술", 90, new BigDecimal("80000"), BeautyServiceTargetGender.ALL,    4),
                new Def("GREY_COVERAGE",    "새치 커버",       "COLOR", "새치 100% 커버 전용 염색", 80, new BigDecimal("55000"), BeautyServiceTargetGender.ALL,    5),
                new Def("TONING",           "토닝",            "COLOR", "손상 없이 색감을 부드럽게 조정", 60, new BigDecimal("40000"), BeautyServiceTargetGender.ALL,    6),
                // ── CLINIC ───────────────────────────────────────────────────────
                new Def("BASIC_CLINIC",     "기본 클리닉",     "CLINIC", "손상 케어 중심의 기본 트리트먼트", 50, new BigDecimal("40000"), BeautyServiceTargetGender.ALL,    0),
                new Def("PREMIUM_CLINIC",   "프리미엄 클리닉", "CLINIC", "고농도 케라틴 성분 집중 케어", 70, new BigDecimal("70000"), BeautyServiceTargetGender.ALL,    1),
                new Def("SCALP_CLINIC",     "두피 클리닉",     "CLINIC", "두피 스케일링 + 앰플 케어", 60, new BigDecimal("60000"), BeautyServiceTargetGender.ALL,    2),
                new Def("KERATIN_TREAT",    "케라틴 트리트먼트","CLINIC", "케라틴 코팅으로 윤기와 보호막 형성", 80, new BigDecimal("80000"), BeautyServiceTargetGender.ALL,    3),
                // ── STYLING ──────────────────────────────────────────────────────
                new Def("BLOWDRY",          "드라이",          "STYLING", "샴푸 후 볼륨 있는 드라이 스타일링", 30, new BigDecimal("15000"), BeautyServiceTargetGender.ALL,    0),
                new Def("IRON_STYLING",     "아이론 스타일링", "STYLING", "고데기로 웨이브 또는 직모 스타일링", 40, new BigDecimal("20000"), BeautyServiceTargetGender.ALL,    1),
                new Def("UPSTYLE",          "업스타일",        "STYLING", "웨딩·행사용 핀업 업스타일", 60, new BigDecimal("50000"), BeautyServiceTargetGender.WOMEN, 2),
                new Def("WEDDING_TRIAL",    "웨딩 트라이얼",   "STYLING", "웨딩 당일 연출을 미리 체험하는 시술", 90, new BigDecimal("80000"), BeautyServiceTargetGender.WOMEN, 3)
        );

        for (Def def : defs) {
            BeautyServiceCategory category = categoryRepository.findByCode(def.categoryCode())
                    .orElseThrow();

            BeautyService service = beautyServiceRepository.findByCode(def.code())
                    .orElseGet(() -> BeautyService.create(
                            def.code(),
                            def.name(),
                            category,
                            def.description(),
                            def.durationMinutes(),
                            def.price(),
                            def.targetGender(),
                            true,
                            def.displayOrder(),
                            List.of()
                    ));

            service.update(
                    def.name(),
                    category,
                    def.description(),
                    def.durationMinutes(),
                    def.price(),
                    def.targetGender(),
                    true,
                    def.displayOrder(),
                    service.getImageUrls()
            );

            beautyServiceRepository.save(service);
            log.info("Seeded beauty service: {}", def.code());
        }
    }
}
