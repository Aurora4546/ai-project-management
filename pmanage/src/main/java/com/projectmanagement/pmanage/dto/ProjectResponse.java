package com.projectmanagement.pmanage.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ProjectResponse {
    private UUID id;
    private String name;
    private String projectKey;
    private String description;
    private List<ProjectMemberResponse> leads;
    private List<ProjectMemberResponse> members;
    private LocalDateTime createdAt;
    private String creatorEmail;
    private String currentUserRole;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProjectKey() {
        return projectKey;
    }

    public void setProjectKey(String projectKey) {
        this.projectKey = projectKey;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<ProjectMemberResponse> getLeads() {
        return leads;
    }

    public void setLeads(List<ProjectMemberResponse> leads) {
        this.leads = leads;
    }

    public List<ProjectMemberResponse> getMembers() {
        return members;
    }

    public void setMembers(List<ProjectMemberResponse> members) {
        this.members = members;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatorEmail() {
        return creatorEmail;
    }

    public void setCreatorEmail(String creatorEmail) {
        this.creatorEmail = creatorEmail;
    }

    public String getCurrentUserRole() {
        return currentUserRole;
    }

    public void setCurrentUserRole(String currentUserRole) {
        this.currentUserRole = currentUserRole;
    }
}
