package com.projectmanagement.pmanage.service;

import com.projectmanagement.pmanage.dto.CreateProjectRequest;
import com.projectmanagement.pmanage.dto.ProjectMemberResponse;
import com.projectmanagement.pmanage.dto.ProjectResponse;
import com.projectmanagement.pmanage.dto.UpdateProjectRequest;
import com.projectmanagement.pmanage.model.Project;
import com.projectmanagement.pmanage.model.ProjectMember;
import com.projectmanagement.pmanage.model.ProjectRole;
import com.projectmanagement.pmanage.model.User;
import com.projectmanagement.pmanage.repository.ChatFileAttachmentRepository;
import com.projectmanagement.pmanage.repository.ChatMessageRepository;
import com.projectmanagement.pmanage.repository.ChatReadReceiptRepository;
import com.projectmanagement.pmanage.repository.ChatReadStatusRepository;
import com.projectmanagement.pmanage.repository.LabelRepository;
import com.projectmanagement.pmanage.repository.ProjectReportRepository;
import com.projectmanagement.pmanage.repository.ProjectRepository;
import com.projectmanagement.pmanage.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatFileAttachmentRepository chatFileAttachmentRepository;
    private final ChatReadReceiptRepository chatReadReceiptRepository;
    private final ChatReadStatusRepository chatReadStatusRepository;
    private final ProjectReportRepository projectReportRepository;
    private final LabelRepository labelRepository;

    public ProjectService(
            ProjectRepository projectRepository,
            UserRepository userRepository,
            ChatMessageRepository chatMessageRepository,
            ChatFileAttachmentRepository chatFileAttachmentRepository,
            ChatReadReceiptRepository chatReadReceiptRepository,
            ChatReadStatusRepository chatReadStatusRepository,
            ProjectReportRepository projectReportRepository,
            LabelRepository labelRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.chatFileAttachmentRepository = chatFileAttachmentRepository;
        this.chatReadReceiptRepository = chatReadReceiptRepository;
        this.chatReadStatusRepository = chatReadStatusRepository;
        this.projectReportRepository = projectReportRepository;
        this.labelRepository = labelRepository;
    }

    public List<ProjectResponse> getProjectsForUser(String email) {
        List<Project> projects = projectRepository.findAllByUserEmail(email);
        return projects.stream()
                .map(p -> mapToResponse(p, email))
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(UUID projectId, String userEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        return mapToResponse(project, userEmail);
    }

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, String creatorEmail) {
        if (projectRepository.existsByProjectKey(request.getProjectKey())) {
            throw new IllegalArgumentException("Project key already exists");
        }

        Project project = new Project();
        project.setName(request.getName());
        project.setProjectKey(request.getProjectKey());
        project.setDescription(request.getDescription());
        project.setCreatorEmail(creatorEmail);

        // Process Leads — creator must always be included
        boolean creatorIsInLeads = false;
        if (request.getLeads() != null && !request.getLeads().isEmpty()) {
            for (String email : request.getLeads()) {
                User leadUser = userRepository.findByEmail(email)
                        .orElseThrow(() -> new IllegalArgumentException("Project lead with email " + email + " not found"));

                ProjectMember pm = new ProjectMember();
                pm.setProject(project);
                pm.setUser(leadUser);
                pm.setRole(ProjectRole.PROJECT_MANAGER);
                project.getMembers().add(pm);

                if (email.equals(creatorEmail)) {
                    creatorIsInLeads = true;
                }
            }
        }

        // Always ensure creator is a lead
        if (!creatorIsInLeads) {
            User creatorUser = userRepository.findByEmail(creatorEmail)
                    .orElseThrow(() -> new IllegalArgumentException("Creator user not found"));
            ProjectMember pm = new ProjectMember();
            pm.setProject(project);
            pm.setUser(creatorUser);
            pm.setRole(ProjectRole.PROJECT_MANAGER);
            project.getMembers().add(pm);
        }

        // Process Members
        if (request.getMembers() != null) {
            for (String email : request.getMembers()) {
                boolean isAlreadyLead = project.getMembers().stream()
                        .anyMatch(m -> m.getUser().getEmail().equals(email) && m.getRole() == ProjectRole.PROJECT_MANAGER);

                if (!isAlreadyLead) {
                    User memberUser = userRepository.findByEmail(email)
                            .orElseThrow(() -> new IllegalArgumentException("Team member with email " + email + " not found"));

                    ProjectMember pm = new ProjectMember();
                    pm.setProject(project);
                    pm.setUser(memberUser);
                    pm.setRole(ProjectRole.PROJECT_MEMBER);
                    project.getMembers().add(pm);
                }
            }
        }

        Project savedProject = projectRepository.save(project);
        return mapToResponse(savedProject, creatorEmail);
    }

    @Transactional
    public ProjectResponse updateProject(UUID projectId, UpdateProjectRequest request, String updaterEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        boolean isLead = project.getMembers().stream()
                .anyMatch(pm -> pm.getUser().getEmail().equals(updaterEmail) && pm.getRole() == ProjectRole.PROJECT_MANAGER);
        if (!isLead) {
            throw new IllegalArgumentException("Only project leads can update the project");
        }

        // Guard: creator cannot be removed from leads
        String creatorEmail = project.getCreatorEmail();
        if (request.getLeads() == null || request.getLeads().isEmpty()) {
            throw new IllegalArgumentException("Project must have at least one lead");
        }
        if (creatorEmail != null && !request.getLeads().contains(creatorEmail)) {
            throw new IllegalArgumentException("The original project creator (" + creatorEmail + ") cannot be removed from project leads");
        }

        project.setName(request.getName());
        project.setDescription(request.getDescription());

        project.getMembers().clear();

        for (String email : request.getLeads()) {
            User leadUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("Project lead with email " + email + " not found"));
            ProjectMember pm = new ProjectMember();
            pm.setProject(project);
            pm.setUser(leadUser);
            pm.setRole(ProjectRole.PROJECT_MANAGER);
            project.getMembers().add(pm);
        }

        if (request.getMembers() != null) {
            for (String email : request.getMembers()) {
                boolean isAlreadyLead = project.getMembers().stream()
                        .anyMatch(m -> m.getUser().getEmail().equals(email) && m.getRole() == ProjectRole.PROJECT_MANAGER);
                if (!isAlreadyLead) {
                    User memberUser = userRepository.findByEmail(email)
                            .orElseThrow(() -> new IllegalArgumentException("Team member with email " + email + " not found"));
                    ProjectMember pm = new ProjectMember();
                    pm.setProject(project);
                    pm.setUser(memberUser);
                    pm.setRole(ProjectRole.PROJECT_MEMBER);
                    project.getMembers().add(pm);
                }
            }
        }

        Project savedProject = projectRepository.save(project);
        return mapToResponse(savedProject, updaterEmail);
    }

    @Transactional
    public void deleteProject(UUID projectId, String deleterEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        boolean isLead = project.getMembers().stream()
                .anyMatch(pm -> pm.getUser().getEmail().equals(deleterEmail)
                        && pm.getRole() == ProjectRole.PROJECT_MANAGER);
        if (!isLead) {
            throw new IllegalArgumentException("Only project leads can delete the project");
        }

        // --- Delete FK-dependent child records in safe order ---

        // 1. Read receipts reference both project and chat_messages → delete first
        chatReadReceiptRepository.deleteAllByProjectId(projectId);

        // 2. Read status tracks per-project read positions (raw UUID column, no FK)
        chatReadStatusRepository.deleteByProjectId(projectId);

        // 3. Chat messages attachments (bulk delete doesn't cascade, so must do manually)
        chatFileAttachmentRepository.deleteAllByProjectId(projectId);

        // 4. Chat messages
        chatMessageRepository.deleteAllByProjectId(projectId);

        // 5. AI-generated project reports
        projectReportRepository.deleteAllByProjectId(projectId);

        // 6. Project labels
        labelRepository.deleteAllByProjectId(projectId);

        // 7. Finally delete the project itself
        //    Issues and ProjectMembers cascade via CascadeType.ALL on Project entity
        projectRepository.delete(project);
    }

    private ProjectResponse mapToResponse(Project project, String currentUserEmail) {
        ProjectResponse response = new ProjectResponse();
        response.setId(project.getId());
        response.setName(project.getName());
        response.setProjectKey(project.getProjectKey());
        response.setDescription(project.getDescription());
        response.setCreatedAt(project.getCreatedAt());
        response.setCreatorEmail(project.getCreatorEmail());

        // Determine the current user's role in this project
        String userRole = project.getMembers().stream()
                .filter(pm -> pm.getUser().getEmail().equals(currentUserEmail))
                .map(pm -> pm.getRole().name())
                .findFirst()
                .orElse("NONE");
        response.setCurrentUserRole(userRole);

        List<ProjectMemberResponse> leadsResponse = project.getMembers().stream()
                .filter(pm -> pm.getRole() == ProjectRole.PROJECT_MANAGER)
                .map(pm -> new ProjectMemberResponse(
                        pm.getUser().getId(),
                        pm.getUser().getEmail(),
                        pm.getUser().getFirstName(),
                        pm.getUser().getLastName(),
                        pm.getRole().name()
                ))
                .collect(Collectors.toList());
        response.setLeads(leadsResponse);

        List<ProjectMemberResponse> membersResponse = project.getMembers().stream()
                .filter(pm -> pm.getRole() != ProjectRole.PROJECT_MANAGER)
                .map(pm -> new ProjectMemberResponse(
                        pm.getUser().getId(),
                        pm.getUser().getEmail(),
                        pm.getUser().getFirstName(),
                        pm.getUser().getLastName(),
                        pm.getRole().name()
                ))
                .collect(Collectors.toList());
        response.setMembers(membersResponse);

        return response;
    }
}
