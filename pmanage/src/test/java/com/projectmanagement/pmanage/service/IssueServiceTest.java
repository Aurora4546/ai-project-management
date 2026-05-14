package com.projectmanagement.pmanage.service;

import com.projectmanagement.pmanage.dto.IssueRequest;
import com.projectmanagement.pmanage.dto.IssueResponse;
import com.projectmanagement.pmanage.exception.ResourceNotFoundException;
import com.projectmanagement.pmanage.model.*;
import com.projectmanagement.pmanage.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("IssueService Unit Tests")
class IssueServiceTest {

    @Mock
    private IssueRepository issueRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private IssueHistoryRepository historyRepository;
    @Mock
    private LabelRepository labelRepository;

    @InjectMocks
    private IssueService issueService;

    @Test
    @DisplayName("Should create issue with generated key")
    void shouldCreateIssueSuccessfully() {
        // Given
        UUID projectId = UUID.randomUUID();
        Project project = new Project();
        project.setId(projectId);
        project.setProjectKey("PROJ");
        project.setNextIssueNumber(1);

        IssueRequest request = new IssueRequest();
        request.setProjectId(projectId);
        request.setTitle("Task 1");
        request.setType(IssueType.TASK);

        User currentUser = User.builder().email("user@example.com").build();

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(issueRepository.save(any(Issue.class))).thenAnswer(invocation -> {
            Issue issue = invocation.getArgument(0);
            issue.setId(UUID.randomUUID());
            return issue;
        });

        // When
        IssueResponse response = issueService.createIssue(request, currentUser);

        // Then
        assertThat(response.getTitle()).isEqualTo("Task 1");
        assertThat(response.getIssueKey()).isEqualTo("PROJ-1");
        verify(projectRepository).save(project);
        assertThat(project.getNextIssueNumber()).isEqualTo(2);
    }

    @Test
    @DisplayName("Should throw exception when project not found during issue creation")
    void shouldThrowExceptionWhenProjectNotFound() {
        // Given
        UUID projectId = UUID.randomUUID();
        IssueRequest request = new IssueRequest();
        request.setProjectId(projectId);

        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        // When / Then
        assertThatThrownBy(() -> issueService.createIssue(request, new User()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Project not found");
    }

    @Test
    @DisplayName("Should update issue and record history")
    void shouldUpdateIssueAndRecordHistory() {
        // Given
        UUID issueId = UUID.randomUUID();
        Project project = new Project();
        project.setProjectKey("PROJ");
        
        Issue issue = new Issue();
        issue.setId(issueId);
        issue.setTitle("Old Title");
        issue.setStatus(IssueStatus.TODO);
        issue.setType(IssueType.TASK);
        issue.setPriority(IssuePriority.MEDIUM);
        issue.setProject(project);

        IssueRequest request = new IssueRequest();
        request.setTitle("New Title");
        request.setStatus(IssueStatus.IN_PROGRESS);
        request.setType(IssueType.TASK);
        request.setPriority(IssuePriority.MEDIUM);

        User currentUser = User.builder().firstName("Editor").build();

        when(issueRepository.findById(issueId)).thenReturn(Optional.of(issue));
        when(issueRepository.save(any(Issue.class))).thenReturn(issue);

        // When
        IssueResponse response = issueService.updateIssue(issueId, request, currentUser);

        // Then
        assertThat(response.getTitle()).isEqualTo("New Title");
        assertThat(response.getStatus()).isEqualTo(IssueStatus.IN_PROGRESS);
        verify(historyRepository, times(2)).save(any(IssueHistory.class));
    }
}
