package com.projectmanagement.pmanage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(max = 50, message = "Project name must not exceed 50 characters")
    private String name;

    @NotBlank(message = "Project key is required")
    @Size(min = 4, max = 4, message = "Project key must be exactly 4 characters")
    @jakarta.validation.constraints.Pattern(regexp = "^[A-Za-z]{4}$", message = "Project key must contain exactly 4 characters")
    private String projectKey;

    @Size(max = 500, message = "Project description must not exceed 500 characters")
    private String description;

    private List<String> leads;

    private List<String> members;

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

    public List<String> getLeads() {
        return leads;
    }

    public void setLeads(List<String> leads) {
        this.leads = leads;
    }

    public List<String> getMembers() {
        return members;
    }

    public void setMembers(List<String> members) {
        this.members = members;
    }
}
