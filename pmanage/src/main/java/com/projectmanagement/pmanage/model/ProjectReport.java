package com.projectmanagement.pmanage.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity for persisting AI-generated project reports.
 * Stores all narrative sections and statistical data as JSON-compatible text.
 */
@Entity
@Table(name = "project_reports")
@Data
public class ProjectReport {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "generated_by_id", nullable = false)
    private User generatedBy;

    @Column(nullable = false)
    private String projectName;

    @Column(nullable = false)
    private String projectKey;

    // AI-generated narrative sections stored as TEXT
    @Column(columnDefinition = "TEXT")
    private String executiveSummary;

    @Column(columnDefinition = "TEXT")
    private String accomplishments;

    @Column(columnDefinition = "TEXT")
    private String blockers;

    @Column(columnDefinition = "TEXT")
    private String nextSteps;

    @Column(columnDefinition = "TEXT")
    private String teamDynamics;

    @Column(columnDefinition = "TEXT")
    private String sprintHealth;

    @Column(columnDefinition = "TEXT")
    private String riskAssessment;

    @Column(columnDefinition = "TEXT")
    private String velocityAnalysis;

    // Statistics stored as JSON strings
    @Column(columnDefinition = "TEXT")
    private String issuesByStatusJson;

    @Column(columnDefinition = "TEXT")
    private String issuesByPriorityJson;

    @Column(columnDefinition = "TEXT")
    private String issuesByTypeJson;

    @Column(columnDefinition = "TEXT")
    private String issuesByAssigneeJson;

    @Column(columnDefinition = "TEXT")
    private String issueSnapshotsJson;

    @Column(columnDefinition = "TEXT")
    private String messageSnapshotsJson;

    private long totalIssues;
    private long completedIssues;
    private long totalMessages;
    private long overdueIssues;
    private long unassignedIssues;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
