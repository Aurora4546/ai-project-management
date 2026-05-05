package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.ProjectReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for persisted AI project reports.
 */
@Repository
public interface ProjectReportRepository extends JpaRepository<ProjectReport, UUID> {

    List<ProjectReport> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

    long countByProjectId(UUID projectId);

    /**
     * Bulk-deletes all reports for a project before project deletion.
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM ProjectReport r WHERE r.project.id = :projectId")
    void deleteAllByProjectId(UUID projectId);
}
