package com.projectmanagement.pmanage.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmanagement.pmanage.dto.ReportResponse;
import com.projectmanagement.pmanage.model.*;
import com.projectmanagement.pmanage.repository.ChatMessageRepository;
import com.projectmanagement.pmanage.repository.IssueRepository;
import com.projectmanagement.pmanage.repository.ProjectReportRepository;
import com.projectmanagement.pmanage.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Orchestrates AI-powered project report generation.
 * Collects project data (issues, chat history, members), builds a structured prompt,
 * sends it to Google Gemini via Spring AI ChatClient, and returns a structured report.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ChatClient.Builder chatClientBuilder;
    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ProjectReportRepository projectReportRepository;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final int MAX_CHAT_MESSAGES = 200;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /**
     * Generates a full AI-powered project report and persists it.
     */
    @Transactional
    public ReportResponse generateReport(UUID projectId, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<Issue> issues = issueRepository.findByProjectIdOrderByPositionAsc(projectId);
        List<ChatMessage> chatMessages = chatMessageRepository
                .findRecentProjectMessages(projectId, PageRequest.of(0, MAX_CHAT_MESSAGES));
        long totalMessages = chatMessageRepository.countProjectMessages(projectId);

        // Compute raw statistics
        Map<String, Long> issuesByStatus = computeGroupCounts(issues, i -> i.getStatus().name());
        Map<String, Long> issuesByPriority = computeGroupCounts(issues, i -> i.getPriority().name());
        Map<String, Long> issuesByType = computeGroupCounts(issues, i -> i.getType().name());
        Map<String, Long> issuesByAssignee = computeGroupCounts(issues, i ->
                i.getAssignee() != null
                        ? i.getAssignee().getFirstName() + " " + i.getAssignee().getLastName()
                        : "Unassigned");

        long completedIssues = issues.stream()
                .filter(i -> i.getStatus() == IssueStatus.DONE)
                .count();

        long overdueIssues = issues.stream()
                .filter(i -> i.getEndDate() != null
                        && i.getEndDate().isBefore(java.time.LocalDate.now())
                        && i.getStatus() != IssueStatus.DONE)
                .count();

        long unassignedIssues = issues.stream()
                .filter(i -> i.getAssignee() == null)
                .count();

        // Build the prompt with project context
        String contextPrompt = buildContextPrompt(project, issues, chatMessages, totalMessages,
                issuesByStatus, issuesByPriority, issuesByType, issuesByAssignee,
                overdueIssues, unassignedIssues);

        // Call AI
        String aiResponse = callGemini(contextPrompt);

        // Parse AI response into sections
        ReportResponse response = parseAiResponse(aiResponse, project, issues.size(), completedIssues, totalMessages,
                issuesByStatus, issuesByPriority, issuesByType, issuesByAssignee,
                overdueIssues, unassignedIssues);

        // Persist the report
        ProjectReport saved = persistReport(project, currentUser, response,
                issuesByStatus, issuesByPriority, issuesByType, issuesByAssignee);
        response.setId(saved.getId().toString());
        response.setGeneratedByName(currentUser.getFirstName() + " " + currentUser.getLastName());

        return response;
    }

    /**
     * Retrieves all saved reports for a project, ordered by newest first.
     */
    public List<ReportResponse> getReportHistory(UUID projectId) {
        return projectReportRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::entityToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a single saved report by ID.
     */
    public ReportResponse getReportById(UUID reportId) {
        ProjectReport entity = projectReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        return entityToResponse(entity);
    }

    /**
     * Deletes a saved report by ID.
     */
    public void deleteReport(UUID reportId) {
        projectReportRepository.deleteById(reportId);
    }

    // ── Persistence helpers ──────────────────────────────

    private ProjectReport persistReport(Project project, User user, ReportResponse response,
                                         Map<String, Long> byStatus, Map<String, Long> byPriority,
                                         Map<String, Long> byType, Map<String, Long> byAssignee) {
        ProjectReport entity = new ProjectReport();
        entity.setProject(project);
        entity.setGeneratedBy(user);
        entity.setProjectName(project.getName());
        entity.setProjectKey(project.getProjectKey());
        entity.setExecutiveSummary(response.getExecutiveSummary());
        entity.setAccomplishments(response.getAccomplishments());
        entity.setBlockers(response.getBlockers());
        entity.setNextSteps(response.getNextSteps());
        entity.setTeamDynamics(response.getTeamDynamics());
        entity.setSprintHealth(response.getSprintHealth());
        entity.setRiskAssessment(response.getRiskAssessment());
        entity.setVelocityAnalysis(response.getVelocityAnalysis());
        entity.setTotalIssues(response.getTotalIssues());
        entity.setCompletedIssues(response.getCompletedIssues());
        entity.setTotalMessages(response.getTotalMessages());
        entity.setOverdueIssues(response.getOverdueIssues());
        entity.setUnassignedIssues(response.getUnassignedIssues());
        entity.setIssuesByStatusJson(toJson(byStatus));
        entity.setIssuesByPriorityJson(toJson(byPriority));
        entity.setIssuesByTypeJson(toJson(byType));
        entity.setIssuesByAssigneeJson(toJson(byAssignee));
        return projectReportRepository.save(entity);
    }

    private ReportResponse entityToResponse(ProjectReport entity) {
        return ReportResponse.builder()
                .id(entity.getId().toString())
                .projectName(entity.getProjectName())
                .projectKey(entity.getProjectKey())
                .generatedAt(entity.getCreatedAt())
                .generatedByName(entity.getGeneratedBy().getFirstName() + " " + entity.getGeneratedBy().getLastName())
                .executiveSummary(entity.getExecutiveSummary())
                .accomplishments(entity.getAccomplishments())
                .blockers(entity.getBlockers())
                .nextSteps(entity.getNextSteps())
                .teamDynamics(entity.getTeamDynamics())
                .sprintHealth(entity.getSprintHealth())
                .riskAssessment(entity.getRiskAssessment())
                .velocityAnalysis(entity.getVelocityAnalysis())
                .issuesByStatus(fromJson(entity.getIssuesByStatusJson()))
                .issuesByPriority(fromJson(entity.getIssuesByPriorityJson()))
                .issuesByType(fromJson(entity.getIssuesByTypeJson()))
                .issuesByAssignee(fromJson(entity.getIssuesByAssigneeJson()))
                .totalIssues(entity.getTotalIssues())
                .completedIssues(entity.getCompletedIssues())
                .totalMessages(entity.getTotalMessages())
                .overdueIssues(entity.getOverdueIssues())
                .unassignedIssues(entity.getUnassignedIssues())
                .build();
    }

    private String toJson(Map<String, Long> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize map to JSON", e);
            return "{}";
        }
    }

    private Map<String, Long> fromJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Long>>() {});
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize JSON to map", e);
            return Collections.emptyMap();
        }
    }

    private String buildContextPrompt(Project project, List<Issue> issues,
                                       List<ChatMessage> chatMessages, long totalMessages,
                                       Map<String, Long> byStatus, Map<String, Long> byPriority,
                                       Map<String, Long> byType, Map<String, Long> byAssignee,
                                       long overdueIssues, long unassignedIssues) {

        StringBuilder sb = new StringBuilder();
        java.time.LocalDate today = java.time.LocalDate.now();

        // ── Project Info ──
        sb.append("=== PROJECT INFO ===\n");
        sb.append("Name: ").append(project.getName()).append("\n");
        sb.append("Key: ").append(project.getProjectKey()).append("\n");
        sb.append("Description: ").append(project.getDescription() != null ? project.getDescription() : "N/A").append("\n");
        sb.append("Report Date: ").append(today).append("\n");
        sb.append("Team Size: ").append(project.getMembers().size()).append(" members\n");
        sb.append("Team Members:\n");
        project.getMembers().forEach(m -> sb.append("  - ").append(m.getUser().getFirstName())
                .append(" ").append(m.getUser().getLastName())
                .append(" (").append(m.getRole().name()).append(")")
                .append(" [").append(m.getUser().getEmail()).append("]")
                .append("\n"));
        sb.append("\n");

        // ── Aggregate Statistics ──
        sb.append("=== AGGREGATE STATISTICS ===\n");
        sb.append("Total Issues: ").append(issues.size()).append("\n");
        long completed = issues.stream().filter(i -> i.getStatus() == IssueStatus.DONE).count();
        long inProgress = issues.stream().filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS).count();
        long inReview = issues.stream().filter(i -> i.getStatus() == IssueStatus.IN_REVIEW).count();
        long todo = issues.stream().filter(i -> i.getStatus() == IssueStatus.TODO).count();
        sb.append("Completed: ").append(completed).append("\n");
        sb.append("In Progress: ").append(inProgress).append("\n");
        sb.append("In Review: ").append(inReview).append("\n");
        sb.append("To Do: ").append(todo).append("\n");
        sb.append("Overdue Issues (past end date, not done): ").append(overdueIssues).append("\n");
        sb.append("Unassigned Issues: ").append(unassignedIssues).append("\n");
        if (!issues.isEmpty()) {
            double completionRate = (double) completed / issues.size() * 100;
            sb.append("Completion Rate: ").append(String.format("%.1f%%", completionRate)).append("\n");
        }
        sb.append("By Status: ").append(byStatus).append("\n");
        sb.append("By Priority: ").append(byPriority).append("\n");
        sb.append("By Type: ").append(byType).append("\n");
        sb.append("By Assignee: ").append(byAssignee).append("\n\n");

        // ── Workload per Team Member ──
        sb.append("=== WORKLOAD PER TEAM MEMBER ===\n");
        Map<String, List<Issue>> issuesByPerson = issues.stream()
                .collect(Collectors.groupingBy(i ->
                        i.getAssignee() != null
                                ? i.getAssignee().getFirstName() + " " + i.getAssignee().getLastName()
                                : "Unassigned"));
        issuesByPerson.forEach((person, personIssues) -> {
            long pDone = personIssues.stream().filter(i -> i.getStatus() == IssueStatus.DONE).count();
            long pActive = personIssues.stream().filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS).count();
            long pOverdue = personIssues.stream()
                    .filter(i -> i.getEndDate() != null && i.getEndDate().isBefore(today) && i.getStatus() != IssueStatus.DONE)
                    .count();
            sb.append("  ").append(person).append(": ")
                    .append(personIssues.size()).append(" total, ")
                    .append(pDone).append(" done, ")
                    .append(pActive).append(" active, ")
                    .append(pOverdue).append(" overdue\n");
        });
        sb.append("\n");

        // ── Detailed Issue List ──
        sb.append("=== ISSUE DETAILS ===\n");
        issues.stream().limit(60).forEach(issue -> {
            sb.append("- [").append(issue.getIssueKey()).append("] ")
                    .append(issue.getTitle())
                    .append(" | Status: ").append(issue.getStatus().name())
                    .append(" | Priority: ").append(issue.getPriority().name())
                    .append(" | Type: ").append(issue.getType().name())
                    .append(" | Assignee: ").append(issue.getAssignee() != null
                            ? issue.getAssignee().getFirstName() + " " + issue.getAssignee().getLastName()
                            : "Unassigned");

            // Add dates if available
            if (issue.getStartDate() != null) {
                sb.append(" | Start: ").append(issue.getStartDate());
            }
            if (issue.getEndDate() != null) {
                sb.append(" | Due: ").append(issue.getEndDate());
                if (issue.getEndDate().isBefore(today) && issue.getStatus() != IssueStatus.DONE) {
                    sb.append(" [OVERDUE]");
                }
            }

            // Add labels
            if (issue.getLabels() != null && !issue.getLabels().isEmpty()) {
                sb.append(" | Labels: ").append(String.join(", ", issue.getLabels()));
            }

            // Add description snippet
            if (issue.getDescription() != null && !issue.getDescription().isBlank()) {
                String desc = issue.getDescription().replaceAll("\\s+", " ").trim();
                sb.append(" | Desc: ").append(desc.length() > 120 ? desc.substring(0, 120) + "..." : desc);
            }

            // Comments count
            if (issue.getComments() != null && !issue.getComments().isEmpty()) {
                sb.append(" | Comments: ").append(issue.getComments().size());
            }

            // Epic reference
            if (issue.getEpic() != null) {
                sb.append(" | Epic: ").append(issue.getEpic().getIssueKey());
            }

            sb.append("\n");
        });
        if (issues.size() > 60) {
            sb.append("... and ").append(issues.size() - 60).append(" more issues\n");
        }
        sb.append("\n");

        // ── High Priority & Overdue Issues (detailed) ──
        List<Issue> criticalIssues = issues.stream()
                .filter(i -> i.getStatus() != IssueStatus.DONE
                        && (i.getPriority() == IssuePriority.HIGH
                        || (i.getEndDate() != null && i.getEndDate().isBefore(today))))
                .toList();
        if (!criticalIssues.isEmpty()) {
            sb.append("=== CRITICAL/OVERDUE ISSUES (Needs Attention) ===\n");
            criticalIssues.forEach(issue -> {
                sb.append("⚠ [").append(issue.getIssueKey()).append("] ").append(issue.getTitle())
                        .append(" | Priority: ").append(issue.getPriority().name())
                        .append(" | Status: ").append(issue.getStatus().name());
                if (issue.getEndDate() != null && issue.getEndDate().isBefore(today)) {
                    sb.append(" | OVERDUE by ").append(java.time.temporal.ChronoUnit.DAYS.between(issue.getEndDate(), today)).append(" days");
                }
                sb.append(" | Assignee: ").append(issue.getAssignee() != null
                        ? issue.getAssignee().getFirstName() + " " + issue.getAssignee().getLastName()
                        : "Unassigned");
                sb.append("\n");
            });
            sb.append("\n");
        }

        // ── Recently Completed Issues ──
        List<Issue> recentlyDone = issues.stream()
                .filter(i -> i.getStatus() == IssueStatus.DONE && i.getUpdatedAt() != null)
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .limit(10)
                .toList();
        if (!recentlyDone.isEmpty()) {
            sb.append("=== RECENTLY COMPLETED ISSUES (Last 10) ===\n");
            recentlyDone.forEach(issue ->
                    sb.append("✓ [").append(issue.getIssueKey()).append("] ").append(issue.getTitle())
                            .append(" | Completed ~").append(issue.getUpdatedAt().format(DATE_FMT))
                            .append("\n"));
            sb.append("\n");
        }

        // ── Chat History ──
        sb.append("=== TEAM CHAT HISTORY (Most Recent ").append(chatMessages.size())
                .append(" of ").append(totalMessages).append(" total messages) ===\n");
        List<ChatMessage> chronological = new ArrayList<>(chatMessages);
        Collections.reverse(chronological);
        chronological.forEach(msg -> {
            String timestamp = msg.getCreatedAt() != null ? msg.getCreatedAt().format(DATE_FMT) : "unknown";
            String senderName = msg.getSender().getFirstName() + " " + msg.getSender().getLastName();
            String cleanContent = msg.getContent() != null
                    ? msg.getContent().replaceAll("@\\[[^\\]]+\\]\\([^)]+\\)", "@mention")
                                      .replaceAll("#\\[[^\\]]+\\]\\([^)]+\\)", "#issue-tag")
                    : "";
            sb.append("[").append(timestamp).append("] ").append(senderName).append(": ").append(cleanContent).append("\n");
        });

        return sb.toString();
    }

    private String callGemini(String contextPrompt) {
        String systemPrompt = """
                You are a project reporting assistant. You receive project data (issues, chat messages, statistics)
                and write a clear, easy-to-read project status update.
                
                WRITING STYLE:
                - Write like a friendly team lead giving a status update, NOT like a management consultant.
                - Keep sentences short and direct. Avoid jargon.
                - Each section should be 3-6 bullet points. Do NOT write walls of text.
                - Reference issue keys (e.g. PROJ-12) and team member names when relevant.
                - Use simple bullet points (- item). Avoid deeply nested sub-lists.
                - Bold only key terms like issue keys, names, or status labels.
                - Do NOT repeat the same information across sections.
                - If there is no relevant data for a section, write one short sentence saying so.
                
                Respond EXACTLY in this format with these 8 section headers (use === as delimiters):
                
                ===EXECUTIVE_SUMMARY===
                Write 2-4 sentences summarizing the project status. Include:
                - Project health: **Healthy**, **At Risk**, or **Critical**
                - Completion rate and what's driving it
                - The single most important thing to know right now
                
                ===ACCOMPLISHMENTS===
                List completed work as bullet points. For each item:
                - Mention the issue key and who completed it
                - Keep each bullet to one sentence
                If nothing was completed, say so briefly.
                
                ===BLOCKERS===
                List current blockers and problems:
                - What is blocked or stalled, and why
                - Any overdue issues with how many days overdue
                - Workload imbalances if any
                Keep each bullet to one sentence. Only list real problems, not hypotheticals.
                
                ===NEXT_STEPS===
                List 3-5 recommended actions, ordered by priority:
                - What should be done first and by whom
                - Reference specific issue keys
                Keep it actionable — each item should be something someone can act on today.
                
                ===TEAM_DYNAMICS===
                Briefly describe how the team is collaborating:
                - Chat activity level (active, quiet, etc.)
                - Notable collaboration patterns
                - One suggestion for improvement if applicable
                Keep this positive and constructive. 2-4 bullet points max.
                
                ===SPRINT_HEALTH===
                Quick health check in 3-4 bullets:
                - How many items are in progress vs. the team size
                - Any bottlenecks (e.g. too many items stuck in review)
                - Overall health: **Excellent**, **Good**, **Needs Attention**, or **Critical**
                
                ===RISK_ASSESSMENT===
                List the top 2-4 risks. For each:
                - One sentence describing the risk
                - Likelihood: **High** / **Medium** / **Low**
                - One sentence on how to mitigate it
                Only list real, data-backed risks. Do not invent risks.
                
                ===VELOCITY_ANALYSIS===
                In 3-4 bullets:
                - Current completion rate and trend
                - Who has the most/least work assigned
                - Where items are getting stuck (which status column)
                - One recommendation to improve flow
                
                CRITICAL FORMATTING RULES:
                - Use single-level bullet points only (- item). No nested bullets.
                - Use **bold** sparingly — only for issue keys, names, and status labels.
                - Do NOT use ### sub-headers inside sections. Just use bullet points.
                - Do NOT use numbered lists. Use bullet points (- ) only.
                - Keep the ENTIRE report concise. Each section should be 2-6 bullets, not more.
                - No filler sentences. Every sentence should contain useful information.
                """;

        try {
            ChatClient chatClient = chatClientBuilder.build();
            String response = chatClient.prompt()
                    .system(systemPrompt)
                    .user(contextPrompt)
                    .call()
                    .content();

            if (response == null || response.isBlank()) {
                log.warn("Gemini returned an empty response");
                return buildFallbackResponse("Gemini returned an empty response.");
            }

            log.info("Gemini AI response received ({} chars). Preview: {}",
                    response.length(),
                    response.substring(0, Math.min(300, response.length())));

            if (!response.contains("===")) {
                log.warn("Gemini response does not contain expected section markers (===). Full response: {}", response);
                return buildFallbackResponse("AI response was not in the expected format.");
            }

            return response;
        } catch (Exception e) {
            log.error("Failed to call Gemini AI: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return buildFallbackResponse("Error: " + e.getMessage());
        }
    }

    private String buildFallbackResponse(String reason) {
        return """
                ===EXECUTIVE_SUMMARY===
                Unable to generate AI analysis at this time. %s
                The report below contains computed statistics only.
                
                ===ACCOMPLISHMENTS===
                AI analysis unavailable. Please review issue statuses for completed work.
                
                ===BLOCKERS===
                AI analysis unavailable. Please review high-priority issues manually.
                
                ===NEXT_STEPS===
                AI analysis unavailable. Please prioritize open issues based on their priority levels.
                
                ===TEAM_DYNAMICS===
                AI analysis unavailable. Please review chat activity manually.
                
                ===SPRINT_HEALTH===
                AI analysis unavailable. Please review work-in-progress items manually.
                
                ===RISK_ASSESSMENT===
                AI analysis unavailable. Please assess project risks manually.
                
                ===VELOCITY_ANALYSIS===
                AI analysis unavailable. Please review team velocity metrics manually.
                """.formatted(reason);
    }

    private ReportResponse parseAiResponse(String aiResponse, Project project,
                                            long totalIssues, long completedIssues, long totalMessages,
                                            Map<String, Long> byStatus, Map<String, Long> byPriority,
                                            Map<String, Long> byType, Map<String, Long> byAssignee,
                                            long overdueIssues, long unassignedIssues) {

        String executiveSummary = extractSection(aiResponse, "EXECUTIVE_SUMMARY");
        String accomplishments = extractSection(aiResponse, "ACCOMPLISHMENTS");
        String blockers = extractSection(aiResponse, "BLOCKERS");
        String nextSteps = extractSection(aiResponse, "NEXT_STEPS");
        String teamDynamics = extractSection(aiResponse, "TEAM_DYNAMICS");
        String sprintHealth = extractSection(aiResponse, "SPRINT_HEALTH");
        String riskAssessment = extractSection(aiResponse, "RISK_ASSESSMENT");
        String velocityAnalysis = extractSection(aiResponse, "VELOCITY_ANALYSIS");

        return ReportResponse.builder()
                .projectName(project.getName())
                .projectKey(project.getProjectKey())
                .generatedAt(LocalDateTime.now())
                .executiveSummary(executiveSummary)
                .accomplishments(accomplishments)
                .blockers(blockers)
                .nextSteps(nextSteps)
                .teamDynamics(teamDynamics)
                .sprintHealth(sprintHealth)
                .riskAssessment(riskAssessment)
                .velocityAnalysis(velocityAnalysis)
                .issuesByStatus(byStatus)
                .issuesByPriority(byPriority)
                .issuesByType(byType)
                .issuesByAssignee(byAssignee)
                .totalIssues(totalIssues)
                .completedIssues(completedIssues)
                .totalMessages(totalMessages)
                .overdueIssues(overdueIssues)
                .unassignedIssues(unassignedIssues)
                .build();
    }

    private String extractSection(String response, String sectionName) {
        if (response == null || response.isBlank()) return "Section not available.";

        // Use regex to find the section content between ===SECTION_NAME=== and the next ===SOMETHING=== (or end)
        String pattern = "===\\s*" + sectionName + "\\s*===\\s*\\n?";
        String nextSectionPattern = "===\\s*[A-Z_]+\\s*===";

        java.util.regex.Pattern startPattern = java.util.regex.Pattern.compile(pattern, java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher startMatcher = startPattern.matcher(response);

        if (!startMatcher.find()) {
            log.warn("Section '{}' not found in AI response. Response preview: {}", sectionName,
                    response.substring(0, Math.min(200, response.length())));
            return "Section not available.";
        }

        int contentStart = startMatcher.end();

        // Find the next section marker after our content
        java.util.regex.Pattern nextPattern = java.util.regex.Pattern.compile(nextSectionPattern);
        java.util.regex.Matcher nextMatcher = nextPattern.matcher(response);

        int contentEnd = response.length();
        // Search for the next section marker AFTER our section's content start
        int searchFrom = contentStart;
        while (nextMatcher.find(searchFrom)) {
            // Make sure we don't match our own marker
            if (nextMatcher.start() > contentStart) {
                contentEnd = nextMatcher.start();
                break;
            }
            searchFrom = nextMatcher.end();
        }

        String content = response.substring(contentStart, contentEnd).trim();
        return content.isEmpty() ? "No data available for this section." : content;
    }

    private <T> Map<String, Long> computeGroupCounts(List<T> items, java.util.function.Function<T, String> grouper) {
        return items.stream()
                .collect(Collectors.groupingBy(grouper, Collectors.counting()));
    }
}
