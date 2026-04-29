package com.projectmanagement.pmanage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class UpdateProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(max = 50, message = "Project name must not exceed 50 characters")
    private String name;

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
