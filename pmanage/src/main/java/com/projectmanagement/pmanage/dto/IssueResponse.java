package com.projectmanagement.pmanage.dto;

import com.projectmanagement.pmanage.model.IssuePriority;
import com.projectmanagement.pmanage.model.IssueStatus;
import com.projectmanagement.pmanage.model.IssueType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class IssueResponse {
    private UUID id;
    private String issueKey;
    private String title;
    private String description;
    private IssueType type;
    private IssueStatus status;
    private IssuePriority priority;
    private String assigneeName;
    private Long assigneeId;
    private String assigneeEmail;
    private String projectKey;
    private UUID projectId;
    private String epicKey;
    private UUID epicId;
    private String parentKey;
    private UUID parentId;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<String> labels;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Double position;
    private String aiAssignmentReason;

    // Getters and Setters
    public Double getPosition() { return position; }
    public void setPosition(Double position) { this.position = position; }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getIssueKey() { return issueKey; }
    public void setIssueKey(String issueKey) { this.issueKey = issueKey; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public IssueType getType() { return type; }
    public void setType(IssueType type) { this.type = type; }
    public IssueStatus getStatus() { return status; }
    public void setStatus(IssueStatus status) { this.status = status; }
    public IssuePriority getPriority() { return priority; }
    public void setPriority(IssuePriority priority) { this.priority = priority; }
    public String getAssigneeName() { return assigneeName; }
    public void setAssigneeName(String assigneeName) { this.assigneeName = assigneeName; }
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    public String getAssigneeEmail() { return assigneeEmail; }
    public void setAssigneeEmail(String assigneeEmail) { this.assigneeEmail = assigneeEmail; }
    public String getProjectKey() { return projectKey; }
    public void setProjectKey(String projectKey) { this.projectKey = projectKey; }
    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }
    public String getEpicKey() { return epicKey; }
    public void setEpicKey(String epicKey) { this.epicKey = epicKey; }
    public UUID getEpicId() { return epicId; }
    public void setEpicId(UUID epicId) { this.epicId = epicId; }
    public String getParentKey() { return parentKey; }
    public void setParentKey(String parentKey) { this.parentKey = parentKey; }
    public UUID getParentId() { return parentId; }
    public void setParentId(UUID parentId) { this.parentId = parentId; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public List<String> getLabels() { return labels; }
    public void setLabels(List<String> labels) { this.labels = labels; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getAiAssignmentReason() { return aiAssignmentReason; }
    public void setAiAssignmentReason(String aiAssignmentReason) { this.aiAssignmentReason = aiAssignmentReason; }
}
