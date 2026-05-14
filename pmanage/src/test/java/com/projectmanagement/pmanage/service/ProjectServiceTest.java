package com.projectmanagement.pmanage.service;

import com.projectmanagement.pmanage.dto.CreateProjectRequest;
import com.projectmanagement.pmanage.dto.ProjectResponse;
import com.projectmanagement.pmanage.model.Project;
import com.projectmanagement.pmanage.model.ProjectRole;
import com.projectmanagement.pmanage.model.User;
import com.projectmanagement.pmanage.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectService Unit Tests")
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private ChatFileAttachmentRepository chatFileAttachmentRepository;
    @Mock
    private ChatReadReceiptRepository chatReadReceiptRepository;
    @Mock
    private ChatReadStatusRepository chatReadStatusRepository;
    @Mock
    private ProjectReportRepository projectReportRepository;
    @Mock
    private LabelRepository labelRepository;

    @InjectMocks
    private ProjectService projectService;

    @Test
    @DisplayName("Should create project and assign creator as lead")
    void shouldCreateProjectSuccessfully() {
        // Given
        String creatorEmail = "creator@example.com";
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("New Project");
        request.setProjectKey("NEWP");
        request.setDescription("Desc");

        User creator = User.builder().email(creatorEmail).build();

        when(projectRepository.existsByProjectKey("NEWP")).thenReturn(false);
        when(userRepository.findByEmail(creatorEmail)).thenReturn(Optional.of(creator));
        when(projectRepository.save(any(Project.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        ProjectResponse response = projectService.createProject(request, creatorEmail);

        // Then
        assertThat(response.getName()).isEqualTo("New Project");
        assertThat(response.getProjectKey()).isEqualTo("NEWP");
        assertThat(response.getCreatorEmail()).isEqualTo(creatorEmail);
        
        ArgumentCaptor<Project> projectCaptor = ArgumentCaptor.forClass(Project.class);
        verify(projectRepository).save(projectCaptor.capture());
        Project savedProject = projectCaptor.getValue();
        
        assertThat(savedProject.getMembers()).hasSize(1);
        assertThat(savedProject.getMembers().get(0).getUser().getEmail()).isEqualTo(creatorEmail);
        assertThat(savedProject.getMembers().get(0).getRole()).isEqualTo(ProjectRole.PROJECT_MANAGER);
    }

    @Test
    @DisplayName("Should throw exception when project key already exists")
    void shouldThrowExceptionWhenProjectKeyExists() {
        // Given
        CreateProjectRequest request = new CreateProjectRequest();
        request.setProjectKey("DUPE");
        when(projectRepository.existsByProjectKey("DUPE")).thenReturn(true);

        // When / Then
        assertThatThrownBy(() -> projectService.createProject(request, "user@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Project key already exists");
    }

    @Test
    @DisplayName("Should throw exception when project leads are updated by non-lead")
    void shouldThrowExceptionWhenNonLeadUpdatesProject() {
        // Given
        String nonLeadEmail = "member@example.com";
        Project project = new Project();
        project.setCreatorEmail("creator@example.com");
        
        User member = User.builder().email(nonLeadEmail).build();
        // project has no members in this mock setup, so nonLeadEmail will not be found as lead

        when(projectRepository.findById(any())).thenReturn(Optional.of(project));

        // When / Then
        assertThatThrownBy(() -> projectService.updateProject(any(), null, nonLeadEmail))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only project leads can update the project");
    }
}
