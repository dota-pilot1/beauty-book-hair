package com.cj.beautybook.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Order(7)
@RequiredArgsConstructor
public class BeautyServiceCategoryBackfillRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!tableExists("beauty_services") || !columnExists("beauty_services", "category_id")) {
            return;
        }

        if (columnExists("beauty_services", "category")) {
            int updated = jdbcTemplate.update("""
                    update beauty_services bs
                       set category_id = c.id
                      from beauty_service_categories c
                     where bs.category_id is null
                       and bs.category is not null
                       and c.code = bs.category
                    """);
            log.info("Backfilled beauty service categories from legacy category column: {}", updated);

            jdbcTemplate.execute("ALTER TABLE beauty_services ALTER COLUMN category DROP NOT NULL");
            log.info("Dropped NOT NULL constraint from legacy category column");
        }

        int fallbackUpdated = jdbcTemplate.update("""
                update beauty_services bs
                   set category_id = (
                       select c.id
                         from beauty_service_categories c
                        order by c.display_order asc, c.id asc
                        limit 1
                   )
                 where bs.category_id is null
                   and exists (select 1 from beauty_service_categories)
                """);
        if (fallbackUpdated > 0) {
            log.info("Backfilled beauty service categories with fallback category: {}", fallbackUpdated);
        }
    }

    private boolean tableExists(String tableName) {
        Boolean exists = jdbcTemplate.queryForObject("""
                select exists (
                    select 1
                      from information_schema.tables
                     where table_schema = 'public'
                       and table_name = ?
                )
                """, Boolean.class, tableName);
        return Boolean.TRUE.equals(exists);
    }

    private boolean columnExists(String tableName, String columnName) {
        Boolean exists = jdbcTemplate.queryForObject("""
                select exists (
                    select 1
                      from information_schema.columns
                     where table_schema = 'public'
                       and table_name = ?
                       and column_name = ?
                )
                """, Boolean.class, tableName, columnName);
        return Boolean.TRUE.equals(exists);
    }
}
