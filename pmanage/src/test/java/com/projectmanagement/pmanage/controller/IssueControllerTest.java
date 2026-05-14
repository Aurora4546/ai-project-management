package com.projectmanagement.pmanage.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectmanagement.pmanage.dto.IssueRequest;
import com.projectmanagement.pmanage.dto.IssueResponse;
import com.projectmanagement.pmanage.model.IssueType;
import com.projectmanagement.pmanage.model.User;
import com.projectmanagement.pmanage.service.AiAssignmentService;
import com.projectmanagement.pmanage.service.IssueService;
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

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IssueController.class)
@Import(JwtAuthenticationFilter.class)
@DisplayName("IssueController API Tests")
class IssueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private IssueService issueService;

    @MockitoBean
    private AiAssignmentService aiAssignmentService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private AuthenticationProvider authenticationProvider;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @Test
    @WithMockUser
    @DisplayName("Should create issue successfully")
    void shouldCreateIssue() throws Exception {
        // Given
        UUID projectId = UUID.randomUUID();
        IssueRequest request = new IssueRequest();
        request.setTitle("Test Task");
        request.setType(IssueType.TASK);
        request.setProjectId(projectId);

        IssueResponse response = new IssueResponse();
        response.setTitle("Test Task");
        response.setIssueKey("PROJ-1");

        when(issueService.createIssue(any(IssueRequest.class), any()))
                .thenReturn(response);

        // When / Then
        mockMvc.perform(post("/api/issues")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Test Task"))
                .andExpect(jsonPath("$.issueKey").value("PROJ-1"));
    }

    @Test
    @WithMockUser
    @DisplayName("Should return 400 for missing title")
    void shouldReturnBadRequestForMissingTitle() throws Exception {
        // Given
        IssueRequest request = new IssueRequest();
        request.setType(IssueType.TASK);
        request.setProjectId(UUID.randomUUID());

        // When / Then
        mockMvc.perform(post("/api/issues")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    @DisplayName("Should get issue by ID")
    void shouldGetIssueById() throws Exception {
        // Given
        UUID issueId = UUID.randomUUID();
        IssueResponse response = new IssueResponse();
        response.setId(issueId);
        response.setTitle("Existing Issue");

        when(issueService.getIssue(issueId)).thenReturn(response);

        // When / Then
        mockMvc.perform(get("/api/issues/{id}", issueId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Existing Issue"));
    }
}
