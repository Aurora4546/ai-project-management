package com.projectmanagement.pmanage.service;

import com.projectmanagement.pmanage.dto.*;
import com.projectmanagement.pmanage.exception.ResourceNotFoundException;
import com.projectmanagement.pmanage.exception.ForbiddenException;
import com.projectmanagement.pmanage.model.*;
import com.projectmanagement.pmanage.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final IssueHistoryRepository historyRepository;
    private final LabelRepository labelRepository;

    @Transactional
    public IssueResponse createIssue(IssueRequest request, User currentUser) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Issue issue = new Issue();
        issue.setProject(project);
        
        // Generate Issue Key
        synchronized (project) {
            String projectKey = project.getProjectKey();
            int nextNumber = project.getNextIssueNumber();
            issue.setIssueKey(projectKey + "-" + nextNumber);
            project.setNextIssueNumber(nextNumber + 1);
            projectRepository.save(project);
        }

        updateIssueFields(issue, request);
        
        // Initialize position if not set
        if (issue.getPosition() == null) {
            Double maxPos = issueRepository.findByProjectIdOrderByPositionAsc(project.getId())
                    .stream()
                    .map(Issue::getPosition)
                    .filter(Objects::nonNull)
                    .max(Comparator.naturalOrder())
                    .orElse(0.0);
            issue.setPosition(maxPos + 65536.0); // Use large steps initially
        }

        Issue savedIssue = issueRepository.save(issue);

        return mapToResponse(savedIssue);
    }

    @Transactional
    public IssueResponse updateIssue(UUID id, IssueRequest request, User currentUser) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        recordHistory(issue, request, currentUser);
        updateIssueFields(issue, request);
        
        Issue updatedIssue = issueRepository.save(issue);
        return mapToResponse(updatedIssue);
    }

    public IssueResponse getIssue(UUID id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
        return mapToResponse(issue);
    }

    public List<IssueResponse> getProjectIssues(UUID projectId) {
        return issueRepository.findByProjectIdOrderByPositionAsc(projectId).stream()

                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<IssueResponse> getEpicsByProject(UUID projectId) {
        return issueRepository.findByProjectIdAndTypeOrderByPositionAsc(projectId, IssueType.EPIC).stream()

                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteIssue(UUID id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        // Detach children to prevent Foreign Key Constraint violations
        List<Issue> childrenByEpic = issueRepository.findByEpicId(id);
        for (Issue child : childrenByEpic) {
            child.setEpic(null);
            issueRepository.save(child);
        }

        List<Issue> childrenByParent = issueRepository.findByParentId(id);
        for (Issue child : childrenByParent) {
            child.setParent(null);
            issueRepository.save(child);
        }

        issueRepository.delete(issue);
    }

    private void updateIssueFields(Issue issue, IssueRequest request) {
        issue.setTitle(request.getTitle());
        issue.setDescription(request.getDescription());
        issue.setType(request.getType());
        issue.setStatus(request.getStatus() != null ? request.getStatus() : IssueStatus.TODO);
        issue.setPriority(request.getPriority() != null ? request.getPriority() : IssuePriority.MEDIUM);
        issue.setStartDate(request.getStartDate());
        issue.setEndDate(request.getEndDate());
        issue.setLabels(request.getLabels() != null ? request.getLabels() : new ArrayList<>());
        
        if (request.getPosition() != null) {
            issue.setPosition(request.getPosition());
        }

        if (request.getAiAssignmentReason() != null) {
            issue.setAiAssignmentReason(request.getAiAssignmentReason());
        }


        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            issue.setAssignee(assignee);
        } else {
            issue.setAssignee(null);
        }

        if (request.getEpicId() != null) {
            Issue epic = issueRepository.findById(request.getEpicId())
                    .orElseThrow(() -> new ResourceNotFoundException("Epic not found"));
            issue.setEpic(epic);
        } else {
            issue.setEpic(null);
        }

        if (request.getParentId() != null) {
            Issue parent = issueRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent issue not found"));
            issue.setParent(parent);
        } else {
            issue.setParent(null);
        }
    }

    private void recordHistory(Issue issue, IssueRequest request, User user) {
        checkAndRecord(issue, "title", issue.getTitle(), request.getTitle(), user);
        checkAndRecord(issue, "description", issue.getDescription(), request.getDescription(), user);
        checkAndRecord(issue, "status", issue.getStatus().name(), request.getStatus() != null ? request.getStatus().name() : null, user);
        checkAndRecord(issue, "priority", issue.getPriority().name(), request.getPriority() != null ? request.getPriority().name() : null, user);
        checkAndRecord(issue, "type", issue.getType().name(), request.getType().name(), user);
        
        String oldAssignee = issue.getAssignee() != null ? issue.getAssignee().getEmail() : null;
        String newAssignee = null;
        if (request.getAssigneeId() != null) {
            newAssignee = userRepository.findById(request.getAssigneeId()).map(User::getEmail).orElse(null);
        }
        checkAndRecord(issue, "assignee", oldAssignee, newAssignee, user);

        String oldEpic = issue.getEpic() != null ? issue.getEpic().getIssueKey() : null;
        String newEpic = null;
        if (request.getEpicId() != null) {
            newEpic = issueRepository.findById(request.getEpicId()).map(Issue::getIssueKey).orElse(null);
        }
        checkAndRecord(issue, "epic", oldEpic, newEpic, user);
    }

    private void checkAndRecord(Issue issue, String field, String oldVal, String newVal, User user) {
        if (!Objects.equals(oldVal, newVal)) {
            IssueHistory history = new IssueHistory();
            history.setIssue(issue);
            history.setUser(user);
            history.setField(field);
            history.setOldValue(oldVal);
            history.setNewValue(newVal);
            historyRepository.save(history);
        }
    }

    public IssueResponse mapToResponse(Issue issue) {
        IssueResponse response = new IssueResponse();
        response.setId(issue.getId());
        response.setIssueKey(issue.getIssueKey());
        response.setTitle(issue.getTitle());
        response.setDescription(issue.getDescription());
        response.setType(issue.getType());
        response.setStatus(issue.getStatus());
        response.setPriority(issue.getPriority());
        response.setProjectId(issue.getProject().getId());
        response.setProjectKey(issue.getProject().getProjectKey());
        
        if (issue.getAssignee() != null) {
            response.setAssigneeId(issue.getAssignee().getId());
            response.setAssigneeName(issue.getAssignee().getFirstName() + " " + issue.getAssignee().getLastName());
            response.setAssigneeEmail(issue.getAssignee().getEmail());
        }

        if (issue.getEpic() != null) {
            response.setEpicId(issue.getEpic().getId());
            response.setEpicKey(issue.getEpic().getIssueKey());
        }

        if (issue.getParent() != null) {
            response.setParentId(issue.getParent().getId());
            response.setParentKey(issue.getParent().getIssueKey());
        }

        response.setStartDate(issue.getStartDate());
        response.setEndDate(issue.getEndDate());
        response.setLabels(new ArrayList<>(issue.getLabels()));
        response.setCreatedAt(issue.getCreatedAt());
        response.setUpdatedAt(issue.getUpdatedAt());
        response.setPosition(issue.getPosition());
        response.setAiAssignmentReason(issue.getAiAssignmentReason());
        return response;

    }

    @Transactional
    public CommentResponse addComment(UUID issueId, CommentRequest request, User author) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
        
        Comment comment = new Comment();
        comment.setIssue(issue);
        comment.setAuthor(author);
        comment.setContent(request.getContent());
        
        Comment savedComment = commentRepository.save(comment);
        return mapToCommentResponse(savedComment);
    }

    @Transactional
    public CommentResponse updateComment(UUID commentId, CommentRequest request, User author) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        if (!comment.getAuthor().getId().equals(author.getId())) {
            throw new ForbiddenException("You can only edit your own comments");
        }
        
        comment.setContent(request.getContent());
        return mapToCommentResponse(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(UUID commentId, User author) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        // Authorization: Author or Project Lead/Admin
        boolean isAuthor = comment.getAuthor().getId().equals(author.getId());
        
        boolean isLeadOrAdmin = comment.getIssue().getProject().getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(author.getId()) && 
                         (m.getRole() == ProjectRole.PROJECT_MANAGER || m.getRole() == ProjectRole.PROJECT_ADMIN));
        
        if (!isAuthor && !isLeadOrAdmin) {
            throw new ForbiddenException("You don't have permission to delete this comment");
        }
        
        commentRepository.delete(comment);
    }

    public List<CommentResponse> getComments(UUID issueId) {
        return commentRepository.findByIssueIdOrderByCreatedAtAsc(issueId).stream()
                .map(this::mapToCommentResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse mapToCommentResponse(Comment comment) {
        CommentResponse response = new CommentResponse();
        response.setId(comment.getId());
        response.setContent(comment.getContent());
        response.setAuthorName(comment.getAuthor().getFirstName() + " " + comment.getAuthor().getLastName());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());
        return response;
    }

    public List<HistoryResponse> getHistory(UUID issueId) {
        return historyRepository.findByIssueIdOrderByCreatedAtDesc(issueId).stream()
                .map(h -> {
                    HistoryResponse r = new HistoryResponse();
                    r.setId(h.getId());
                    r.setField(h.getField());
                    r.setOldValue(h.getOldValue());
                    r.setNewValue(h.getNewValue());
                    r.setUserName(h.getUser() != null ? h.getUser().getFirstName() + " " + h.getUser().getLastName() : "System");
                    r.setAction("updated");
                    r.setTimestamp(h.getCreatedAt());
                    r.setCreatedAt(h.getCreatedAt());
                    return r;
                }).collect(Collectors.toList());
    }

    public List<LabelResponse> getProjectLabels(UUID projectId) {
        return labelRepository.findByProjectIdOrderByNameAsc(projectId).stream()
                .map(l -> new LabelResponse(l.getId(), l.getName(), l.getColor()))
                .collect(Collectors.toList());
    }

    @Transactional
    public LabelResponse createLabel(UUID projectId, LabelRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        // Return existing label if name already exists for this project
        Optional<Label> existing = labelRepository.findByNameAndProjectId(request.getName(), projectId);
        if (existing.isPresent()) {
            Label l = existing.get();
            return new LabelResponse(l.getId(), l.getName(), l.getColor());
        }

        Label label = new Label();
        label.setName(request.getName());
        label.setColor(request.getColor());
        label.setProject(project);
        label = labelRepository.save(label);
        return new LabelResponse(label.getId(), label.getName(), label.getColor());
    }
}
