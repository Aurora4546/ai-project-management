package com.projectmanagement.pmanage.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;

public record AiAssignmentResponse(
    @JsonProperty(required = true)
    @JsonPropertyDescription("The ID of the user assigned to this task.")
    Long assigneeId,
    
    @JsonProperty(required = true)
    @JsonPropertyDescription("A brief, 1-2 sentence explanation of why this user was chosen based on their performance, workload, and skills.")
    String reason
) {}
