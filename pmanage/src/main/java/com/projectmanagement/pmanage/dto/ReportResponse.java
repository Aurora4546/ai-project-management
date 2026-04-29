package com.projectmanagement.pmanage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Response DTO for AI-generated project reports.
 * Contains both AI-synthesized narrative sections and computed statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {

    private String id;
    private String projectName;
    private String projectKey;
    private LocalDateTime generatedAt;
    private String generatedByName;

    // AI-generated narrative sections
    private String executiveSummary;
    private String accomplishments;
    private String blockers;
    private String nextSteps;
    private String teamDynamics;
    private String sprintHealth;
    private String riskAssessment;
    private String velocityAnalysis;

    // Computed statistics
    private Map<String, Long> issuesByStatus;
    private Map<String, Long> issuesByPriority;
    private Map<String, Long> issuesByType;
    private Map<String, Long> issuesByAssignee;
    private long totalIssues;
    private long completedIssues;
    private long totalMessages;
    private long overdueIssues;
    private long unassignedIssues;
}
