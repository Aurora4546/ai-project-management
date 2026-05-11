package com.projectmanagement.pmanage.dto;

import com.projectmanagement.pmanage.model.IssuePriority;
import com.projectmanagement.pmanage.model.IssueStatus;
import com.projectmanagement.pmanage.model.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class IssueRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Issue type is required")
    private IssueType type;

    private IssueStatus status;

    private IssuePriority priority;

    private Long assigneeId;

    @NotNull(message = "Project ID is required")
    private UUID projectId;

    private UUID epicId;

    private UUID parentId;

    private LocalDate startDate;
    private LocalDate endDate;
    private List<String> labels;
    private Double position;
    private String aiAssignmentReason;

    // Getters and Setters
    public Double getPosition() { return position; }
    public void setPosition(Double position) { this.position = position; }

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
    public Long getAssigneeId() { return assigneeId; }
    public void setAssigneeId(Long assigneeId) { this.assigneeId = assigneeId; }
    public UUID getProjectId() { return projectId; }
    public void setProjectId(UUID projectId) { this.projectId = projectId; }
    public UUID getEpicId() { return epicId; }
    public void setEpicId(UUID epicId) { this.epicId = epicId; }
    public UUID getParentId() { return parentId; }
    public void setParentId(UUID parentId) { this.parentId = parentId; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public List<String> getLabels() { return labels; }
    public void setLabels(List<String> labels) { this.labels = labels; }
    public String getAiAssignmentReason() { return aiAssignmentReason; }
    public void setAiAssignmentReason(String aiAssignmentReason) { this.aiAssignmentReason = aiAssignmentReason; }
}
