package com.projectmanagement.pmanage.service;

import com.projectmanagement.pmanage.dto.AiAssignmentRequest;
import com.projectmanagement.pmanage.dto.AiAssignmentResponse;
import com.projectmanagement.pmanage.exception.AiServiceException;
import com.projectmanagement.pmanage.exception.AiServiceException.AiErrorType;
import com.projectmanagement.pmanage.model.Issue;
import com.projectmanagement.pmanage.model.IssueStatus;
import com.projectmanagement.pmanage.model.Project;
import com.projectmanagement.pmanage.model.ProjectMember;
import com.projectmanagement.pmanage.repository.IssueRepository;
import com.projectmanagement.pmanage.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAssignmentService {

    private final ChatClient.Builder chatClientBuilder;
    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;

    @Transactional(readOnly = true)
    public AiAssignmentResponse suggestAssignee(AiAssignmentRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<Issue> projectIssues = issueRepository.findByProjectIdOrderByPositionAsc(project.getId());

        String contextPrompt = buildContextPrompt(request, project, projectIssues);

        return callGemini(contextPrompt);
    }

    private String buildContextPrompt(AiAssignmentRequest request, Project project, List<Issue> allIssues) {
        StringBuilder sb = new StringBuilder();

        sb.append("=== NEW TASK TO ASSIGN ===\n");
        sb.append("Title: ").append(request.getTitle()).append("\n");
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            sb.append("Description: ").append(request.getDescription()).append("\n");
        }
        if (request.getType() != null) sb.append("Type: ").append(request.getType()).append("\n");
        if (request.getPriority() != null) sb.append("Priority: ").append(request.getPriority()).append("\n");
        sb.append("\n");

        sb.append("=== CANDIDATE PROJECT MEMBERS ===\n");
        
        // Group issues by user ID
        Map<Long, List<Issue>> issuesByAssigneeId = allIssues.stream()
                .filter(i -> i.getAssignee() != null)
                .collect(Collectors.groupingBy(i -> i.getAssignee().getId()));

        for (ProjectMember member : project.getMembers()) {
            Long userId = member.getUser().getId();
            String name = member.getUser().getFirstName() + " " + member.getUser().getLastName();
            String explicitSkills = member.getUser().getSkills();
            
            sb.append("Candidate: ").append(name).append(" (ID: ").append(userId).append(")\n");
            
            if (explicitSkills != null && !explicitSkills.isBlank()) {
                sb.append("Explicit Skills: ").append(explicitSkills).append("\n");
            }

            List<Issue> memberIssues = issuesByAssigneeId.getOrDefault(userId, List.of());
            
            List<Issue> activeIssues = memberIssues.stream()
                    .filter(i -> i.getStatus() != IssueStatus.DONE)
                    .toList();
                    
            List<Issue> completedIssues = memberIssues.stream()
                    .filter(i -> i.getStatus() == IssueStatus.DONE)
                    .toList();

            sb.append("Current Workload (Active Issues): ").append(activeIssues.size()).append("\n");
            if (!activeIssues.isEmpty()) {
                sb.append("  Active subjects: ");
                activeIssues.stream().limit(5).forEach(i -> sb.append("[").append(i.getType()).append("] ").append(i.getTitle()).append(", "));
                sb.append("\n");
            }

            sb.append("Past Performance (Completed Issues): ").append(completedIssues.size()).append("\n");
            if (!completedIssues.isEmpty()) {
                sb.append("  Completed subjects / history:\n");
                completedIssues.stream().sorted((a, b) -> {
                    if (a.getUpdatedAt() == null && b.getUpdatedAt() == null) return 0;
                    if (a.getUpdatedAt() == null) return 1;
                    if (b.getUpdatedAt() == null) return -1;
                    return b.getUpdatedAt().compareTo(a.getUpdatedAt()); // newest first
                }).limit(10).forEach(i -> {
                    sb.append("    - [").append(i.getType()).append("] ").append(i.getTitle());
                    if (i.getStartDate() != null && i.getEndDate() != null) {
                        long days = ChronoUnit.DAYS.between(i.getStartDate(), i.getEndDate());
                        sb.append(" (Scheduled duration: ").append(days).append(" days)");
                    }
                    sb.append("\n");
                });
            }
            sb.append("\n");
        }

        return sb.toString();
    }

    private AiAssignmentResponse callGemini(String contextPrompt) {
        String systemPrompt = """
                You are an intelligent project management assistant. Your job is to automatically assign a new task to the best project member.
                
                You are given:
                1. The details of a NEW TASK.
                2. A list of CANDIDATE PROJECT MEMBERS, including their ID, explicit skills, current workload (active issues), and past performance (recently completed issues).
                
                HOW TO DECIDE:
                - Analyze the title and description of the NEW TASK.
                - Review the completed tasks of each candidate to infer their implicit skills (what subjects are they most capable of? e.g. frontend, backend, design, devops, bug fixing).
                - Consider the time duration they usually handle.
                - Consider their current workload (do not overload someone if another capable person is free).
                - Pick the absolute best candidate for the job based on a balance of capability (inferred from past performance and skills) and availability (current workload).
                
                IMPORTANT:
                - You MUST return the exact ID of the chosen user as the 'assigneeId'. Do not make up an ID. It must be exactly from the provided candidate IDs.
                - Write a brief 1-2 sentence 'reason' explaining your choice directly to the user (e.g., "John Doe is highly capable with frontend tasks based on past performance and has a light current workload.").
                """;

        try {
            ChatClient chatClient = chatClientBuilder.build();
            AiAssignmentResponse response = chatClient.prompt()
                    .system(systemPrompt)
                    .user(contextPrompt)
                    .call()
                    .entity(AiAssignmentResponse.class);

            if (response == null) {
                log.warn("Gemini returned an empty or null structured response for AI assignment");
                throw new AiServiceException(
                        "The AI model returned an empty response. Please try again in a moment.",
                        AiErrorType.EMPTY_RESPONSE);
            }

            return response;

        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("AI assignment failed: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            throw new AiServiceException("AI assignment encountered an unexpected error: " + e.getMessage(), AiErrorType.UNKNOWN, e);
        }
    }
}
