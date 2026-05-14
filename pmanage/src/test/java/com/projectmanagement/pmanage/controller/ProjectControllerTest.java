package com.projectmanagement.pmanage.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmanagement.pmanage.dto.CreateProjectRequest;
import com.projectmanagement.pmanage.dto.ProjectResponse;
import com.projectmanagement.pmanage.service.ProjectService;
import com.projectmanagement.pmanage.security.JwtAuthenticationFilter;
import com.projectmanagement.pmanage.security.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjectController.class)
@Import(JwtAuthenticationFilter.class)
@DisplayName("ProjectController API Tests")
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProjectService projectService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private AuthenticationProvider authenticationProvider;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("Should return user projects")
    void shouldReturnUserProjects() throws Exception {
        // Given
        ProjectResponse project = new ProjectResponse();
        project.setName("Test Project");
        when(projectService.getProjectsForUser("test@example.com"))
                .thenReturn(Collections.singletonList(project));

        // When / Then
        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Test Project"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("Should create project with valid data")
    void shouldCreateProject() throws Exception {
        // Given
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("New Project");
        request.setProjectKey("NEWP");

        ProjectResponse response = new ProjectResponse();
        response.setName("New Project");
        response.setProjectKey("NEWP");

        when(projectService.createProject(any(CreateProjectRequest.class), eq("test@example.com")))
                .thenReturn(response);

        // When / Then
        mockMvc.perform(post("/api/v1/projects")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Project"))
                .andExpect(jsonPath("$.projectKey").value("NEWP"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    @DisplayName("Should return 400 when project key is invalid")
    void shouldReturnBadRequestForInvalidProjectKey() throws Exception {
        // Given
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("New Project");
        request.setProjectKey("BAD"); // Too short

        // When / Then
        mockMvc.perform(post("/api/v1/projects")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 401 when unauthenticated")
    void shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isUnauthorized());
    }
}
