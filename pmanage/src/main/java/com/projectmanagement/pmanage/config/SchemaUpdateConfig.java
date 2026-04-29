package com.projectmanagement.pmanage.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures the project_reports table schema is in sync with the ProjectReport entity.
 * Adds any missing columns that Hibernate's ddl-auto=update may have failed to create.
 * Each ALTER TABLE uses IF NOT EXISTS logic via information_schema checks.
 */
@Slf4j
@Component
public class SchemaUpdateConfig {

    @PersistenceContext
    private EntityManager entityManager;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void updateProjectReportsSchema() {
        log.info("Checking project_reports table schema for missing columns...");

        String[] columns = {
                "executive_summary TEXT",
                "accomplishments TEXT",
                "blockers TEXT",
                "next_steps TEXT",
                "team_dynamics TEXT",
                "sprint_health TEXT",
                "risk_assessment TEXT",
                "velocity_analysis TEXT",
                "issues_by_status_json TEXT",
                "issues_by_priority_json TEXT",
                "issues_by_type_json TEXT",
                "issues_by_assignee_json TEXT",
                "total_issues BIGINT DEFAULT 0",
                "completed_issues BIGINT DEFAULT 0",
                "total_messages BIGINT DEFAULT 0",
                "overdue_issues BIGINT DEFAULT 0",
                "unassigned_issues BIGINT DEFAULT 0"
        };

        int addedCount = 0;
        for (String columnDef : columns) {
            String columnName = columnDef.split(" ")[0];
            try {
                Long exists = (Long) entityManager.createNativeQuery(
                        "SELECT COUNT(*) FROM information_schema.columns " +
                        "WHERE table_name = 'project_reports' AND column_name = :colName"
                ).setParameter("colName", columnName).getSingleResult();

                if (exists == 0) {
                    entityManager.createNativeQuery(
                            "ALTER TABLE project_reports ADD COLUMN " + columnDef
                    ).executeUpdate();
                    log.info("Added missing column: {}", columnName);
                    addedCount++;
                }
            } catch (Exception e) {
                log.warn("Could not add column '{}': {}", columnName, e.getMessage());
            }
        }

        if (addedCount > 0) {
            log.info("Schema update complete. Added {} missing column(s) to project_reports.", addedCount);
        } else {
            log.info("Schema check complete. All columns exist in project_reports.");
        }
    }
}
