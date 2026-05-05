package com.projectmanagement.pmanage.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;

public record AiReportStructure(
    @JsonProperty(required = true)
    @JsonPropertyDescription("2-4 sentences summarizing project status. Include health, completion rate, and the single most important thing to know.")
    String executiveSummary,
    
    @JsonProperty(required = true)
    @JsonPropertyDescription("List completed work as bullet points. Mention issue keys and who completed them.")
    String accomplishments,
    
    @JsonProperty(required = true)
    @JsonPropertyDescription("List current blockers, problems, overdue issues, or workload imbalances as bullet points.")
    String blockers,
    
    @JsonProperty(required = true)
    @JsonPropertyDescription("List 3-5 recommended actionable steps ordered by priority.")
    String nextSteps,
    
    @JsonProperty(required = true)
    @JsonPropertyDescription("Brief description of how the team is collaborating, chat activity, and suggestions for improvement in bullet points.")
    String teamDynamics,
    
    @JsonProperty(required = true)
    @JsonPropertyDescription("Quick health check on work in progress, bottlenecks, and overall health (Excellent, Good, Needs Attention, Critical) in 3-4 bullets.")
    String sprintHealth,
    
    @JsonProperty(required = true)
    @JsonPropertyDescription("Top 2-4 risks, their likelihood (High/Medium/Low), and mitigation steps in bullet points.")
    String riskAssessment,
    
    @JsonProperty(required = true)
    @JsonPropertyDescription("Completion rate trend, workload distribution, and flow analysis in 3-4 bullet points.")
    String velocityAnalysis
) {}
