package com.projectmanagement.pmanage.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmanagement.pmanage.dto.*;
import com.projectmanagement.pmanage.exception.AiServiceException;
import com.projectmanagement.pmanage.exception.AiServiceException.AiErrorType;
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
 * Collects project data (issues, chat history, members), builds a structured
 * prompt,
 * sends it to Google Gemini via Spring AI ChatClient, and returns a structured
 * report.
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
    private final IssueService issueService;
    private final ChatService chatService;
    private final ObjectMapper objectMapper;

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
        Map<String, Long> issuesByAssignee = computeGroupCounts(issues, i -> i.getAssignee() != null
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
        AiReportStructure aiResponse = callGemini(contextPrompt);

        // Map snapshots for historical viewing (minimized to save space)
        List<IssueResponse> issueSnapshots = issues.stream()
                .map(issueService::mapToResponse)
                .map(this::minimizeIssueResponse)
                .collect(Collectors.toList());
        List<ChatMessageResponse> messageSnapshots = chatMessages.stream()
                .map(chatService::mapToResponse)
                .collect(Collectors.toList());

        // Map AI response into sections
        ReportResponse response = mapToReportResponse(aiResponse, project, issues.size(), completedIssues,
                totalMessages,
                issuesByStatus, issuesByPriority, issuesByType, issuesByAssignee,
                overdueIssues, unassignedIssues);
        response.setIssueSnapshots(issueSnapshots);
        response.setMessageSnapshots(messageSnapshots);

        // Persist the report
        ProjectReport saved = persistReport(project, currentUser, response,
                issuesByStatus, issuesByPriority, issuesByType, issuesByAssignee);
        response.setId(saved.getId().toString());
        response.setGeneratedByName(currentUser.getFirstName() + " " + currentUser.getLastName());

        return response;
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getReportHistory(UUID projectId) {
        return projectReportRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(entity -> entityToResponse(entity, false))
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a single saved report by ID.
     */
    @Transactional(readOnly = true)
    public ReportResponse getReportById(UUID reportId) {
        ProjectReport entity = projectReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        return entityToResponse(entity, true);
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
        entity.setIssueSnapshotsJson(toJsonList(response.getIssueSnapshots()));
        entity.setMessageSnapshotsJson(toJsonList(response.getMessageSnapshots()));
        return projectReportRepository.save(entity);
    }

    private ReportResponse entityToResponse(ProjectReport entity, boolean includeSnapshots) {
        ReportResponse.ReportResponseBuilder builder = ReportResponse.builder()
                .id(entity.getId().toString())
                .projectName(entity.getProjectName())
                .projectKey(entity.getProjectKey())
                .generatedAt(entity.getCreatedAt())
                .generatedByName(entity.getGeneratedBy().getFirstName() + " " + entity.getGeneratedBy().getLastName())
                .executiveSummary(sanitizeAiOutput(entity.getExecutiveSummary()))
                .accomplishments(sanitizeAiOutput(entity.getAccomplishments()))
                .blockers(sanitizeAiOutput(entity.getBlockers()))
                .nextSteps(sanitizeAiOutput(entity.getNextSteps()))
                .teamDynamics(sanitizeAiOutput(entity.getTeamDynamics()))
                .sprintHealth(sanitizeAiOutput(entity.getSprintHealth()))
                .riskAssessment(sanitizeAiOutput(entity.getRiskAssessment()))
                .velocityAnalysis(sanitizeAiOutput(entity.getVelocityAnalysis()))
                .issuesByStatus(fromJson(entity.getIssuesByStatusJson()))
                .issuesByPriority(fromJson(entity.getIssuesByPriorityJson()))
                .issuesByType(fromJson(entity.getIssuesByTypeJson()))
                .issuesByAssignee(fromJson(entity.getIssuesByAssigneeJson()))
                .totalIssues(entity.getTotalIssues())
                .completedIssues(entity.getCompletedIssues())
                .totalMessages(entity.getTotalMessages())
                .overdueIssues(entity.getOverdueIssues())
                .unassignedIssues(entity.getUnassignedIssues());

        if (includeSnapshots) {
            builder.issueSnapshots(
                    fromJsonList(entity.getIssueSnapshotsJson(), new TypeReference<List<IssueResponse>>() {
                    }))
                    .messageSnapshots(fromJsonList(entity.getMessageSnapshotsJson(),
                            new TypeReference<List<ChatMessageResponse>>() {
                            }));
        }

        return builder.build();
    }

    private IssueResponse minimizeIssueResponse(IssueResponse original) {
        IssueResponse minimal = new IssueResponse();
        minimal.setId(original.getId());
        minimal.setIssueKey(original.getIssueKey());
        minimal.setTitle(original.getTitle());
        minimal.setType(original.getType());
        minimal.setStatus(original.getStatus());
        minimal.setPriority(original.getPriority());
        minimal.setAssigneeName(original.getAssigneeName());
        minimal.setAssigneeId(original.getAssigneeId());
        minimal.setAssigneeEmail(original.getAssigneeEmail());
        minimal.setEndDate(original.getEndDate());
        minimal.setLabels(original.getLabels());
        return minimal;
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
        if (json == null || json.isBlank())
            return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Long>>() {
            });
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize JSON to map", e);
            return Collections.emptyMap();
        }
    }

    private String toJsonList(List<?> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize list to JSON", e);
            return "[]";
        }
    }

    private <T> List<T> fromJsonList(String json, TypeReference<List<T>> typeReference) {
        if (json == null || json.isBlank())
            return Collections.emptyList();
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize JSON to list", e);
            return Collections.emptyList();
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
        sb.append("Description: ").append(project.getDescription() != null ? project.getDescription() : "N/A")
                .append("\n");
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
                .collect(Collectors.groupingBy(i -> i.getAssignee() != null
                        ? i.getAssignee().getFirstName() + " " + i.getAssignee().getLastName()
                        : "Unassigned"));
        issuesByPerson.forEach((person, personIssues) -> {
            long pDone = personIssues.stream().filter(i -> i.getStatus() == IssueStatus.DONE).count();
            long pActive = personIssues.stream().filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS).count();
            long pOverdue = personIssues.stream()
                    .filter(i -> i.getEndDate() != null && i.getEndDate().isBefore(today)
                            && i.getStatus() != IssueStatus.DONE)
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
                    sb.append(" | OVERDUE by ")
                            .append(java.time.temporal.ChronoUnit.DAYS.between(issue.getEndDate(), today))
                            .append(" days");
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
            recentlyDone
                    .forEach(issue -> sb.append("✓ [").append(issue.getIssueKey()).append("] ").append(issue.getTitle())
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
            sb.append("[").append(timestamp).append("] ").append(senderName).append(": ").append(cleanContent)
                    .append("\n");
        });

        return sb.toString();
    }

    /**
     * Calls Google Gemini via Spring AI and returns a structured
     * {@link AiReportStructure}.
     *
     * <p>
     * Exceptions are classified into distinct {@link AiErrorType} values and
     * re-thrown
     * as {@link AiServiceException} so the global handler can return the correct
     * HTTP status.
     *
     * <ul>
     * <li>Quota / rate-limit errors → {@code QUOTA_EXCEEDED} (HTTP 429)</li>
     * <li>Invalid / expired key errors → {@code INVALID_API_KEY} (HTTP 401)</li>
     * <li>Timeout / connection errors → {@code SERVICE_UNAVAILABLE} (HTTP 503)</li>
     * <li>Empty / null AI response → {@code EMPTY_RESPONSE} (HTTP 502)</li>
     * <li>Everything else → {@code UNKNOWN} (HTTP 500)</li>
     * </ul>
     */
    private AiReportStructure callGemini(String contextPrompt) {
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
                """;

        try {
            ChatClient chatClient = chatClientBuilder.build();
            AiReportStructure response = chatClient.prompt()
                    .system(systemPrompt)
                    .user(contextPrompt)
                    .call()
                    .entity(AiReportStructure.class);

            if (response == null) {
                log.warn("Gemini returned an empty or null structured response");
                throw new AiServiceException(
                        "The AI model returned an empty response. Please try again in a moment.",
                        AiErrorType.EMPTY_RESPONSE);
            }

            log.info("Gemini AI structured response successfully received and parsed.");
            return response;

        } catch (AiServiceException e) {
            // Already classified — propagate as-is
            throw e;

        } catch (Exception e) {
            AiErrorType errorType = classifyAiException(e);
            String userMessage = buildUserFacingMessage(errorType, e);

            log.error("AI call failed [type={}]: {} - {}",
                    errorType, e.getClass().getSimpleName(), e.getMessage(), e);

            throw new AiServiceException(userMessage, errorType, e);
        }
    }

    /**
     * Inspects the exception chain to determine which {@link AiErrorType} best
     * describes the failure.
     */
    private AiErrorType classifyAiException(Exception e) {
        String msg = extractFullMessage(e).toLowerCase();

        if (msg.contains("429") || msg.contains("quota") || msg.contains("rate limit")
                || msg.contains("resource_exhausted") || msg.contains("too many requests")
                || msg.contains("rate_limit_exceeded")) {
            return AiErrorType.QUOTA_EXCEEDED;
        }
        if (msg.contains("401") || msg.contains("403") || msg.contains("invalid api key")
                || msg.contains("api_key_invalid") || msg.contains("permission_denied")
                || msg.contains("unauthenticated") || msg.contains("apikey")) {
            return AiErrorType.INVALID_API_KEY;
        }
        if (msg.contains("timeout") || msg.contains("timed out") || msg.contains("503")
                || msg.contains("502") || msg.contains("connection") || msg.contains("unavailable")
                || msg.contains("deadline_exceeded")) {
            return AiErrorType.SERVICE_UNAVAILABLE;
        }
        return AiErrorType.UNKNOWN;
    }

    /**
     * Walks the exception cause chain to collect the most descriptive message
     * available.
     */
    private String extractFullMessage(Throwable e) {
        StringBuilder sb = new StringBuilder();
        Throwable current = e;
        while (current != null) {
            if (current.getMessage() != null)
                sb.append(current.getMessage()).append(" ");
            current = current.getCause();
        }
        return sb.toString();
    }

    /**
     * Returns a concise, user-friendly message for each error type.
     */
    private String buildUserFacingMessage(AiErrorType errorType, Exception cause) {
        return switch (errorType) {
            case QUOTA_EXCEEDED ->
                "AI report generation is temporarily unavailable: the API quota has been exceeded. " +
                        "Please wait a moment and try again, or contact your administrator to check the API limits.";
            case INVALID_API_KEY -> "AI report generation failed: the configured API key is invalid or has expired. " +
                    "Please update the GOOGLE_API_KEY environment variable with a valid key.";
            case SERVICE_UNAVAILABLE ->
                "AI report generation failed: the Google Gemini service is temporarily unreachable. " +
                        "Please try again in a few minutes.";
            case EMPTY_RESPONSE -> "AI report generation failed: the model returned an empty response. " +
                    "Please try again.";
            default -> "AI report generation encountered an unexpected error: " + cause.getMessage();
        };
    }

    private String sanitizeAiOutput(String text) {
        if (text == null)
            return null;
        return text
                .replaceAll("(?i)(?<![a-zA-Z0-9])IN[_-]PROGRESS(?![a-zA-Z0-9])", "In Progress")
                .replaceAll("(?i)(?<![a-zA-Z0-9])IN PROGRESS(?![a-zA-Z0-9])", "In Progress")
                .replaceAll("(?i)(?<![a-zA-Z0-9])IN[_-]REVIEW(?![a-zA-Z0-9])", "In Review")
                .replaceAll("(?i)(?<![a-zA-Z0-9])IN REVIEW(?![a-zA-Z0-9])", "In Review")
                .replaceAll("(?i)(?<![a-zA-Z0-9])TODO(?![a-zA-Z0-9])", "To Do")
                .replaceAll("(?i)(?<![a-zA-Z0-9])DONE(?![a-zA-Z0-9])", "Done");
    }

    private ReportResponse mapToReportResponse(AiReportStructure aiResponse, Project project,
            long totalIssues, long completedIssues, long totalMessages,
            Map<String, Long> byStatus, Map<String, Long> byPriority,
            Map<String, Long> byType, Map<String, Long> byAssignee,
            long overdueIssues, long unassignedIssues) {

        return ReportResponse.builder()
                .projectName(project.getName())
                .projectKey(project.getProjectKey())
                .generatedAt(LocalDateTime.now())
                .executiveSummary(sanitizeAiOutput(aiResponse.executiveSummary()))
                .accomplishments(sanitizeAiOutput(aiResponse.accomplishments()))
                .blockers(sanitizeAiOutput(aiResponse.blockers()))
                .nextSteps(sanitizeAiOutput(aiResponse.nextSteps()))
                .teamDynamics(sanitizeAiOutput(aiResponse.teamDynamics()))
                .sprintHealth(sanitizeAiOutput(aiResponse.sprintHealth()))
                .riskAssessment(sanitizeAiOutput(aiResponse.riskAssessment()))
                .velocityAnalysis(sanitizeAiOutput(aiResponse.velocityAnalysis()))
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

    private <T> Map<String, Long> computeGroupCounts(List<T> items, java.util.function.Function<T, String> grouper) {
        return items.stream()
                .collect(Collectors.groupingBy(grouper, Collectors.counting()));
    }
}
