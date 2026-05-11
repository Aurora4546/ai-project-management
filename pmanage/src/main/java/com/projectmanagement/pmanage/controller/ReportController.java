package com.projectmanagement.pmanage.controller;
// Refresh

import com.projectmanagement.pmanage.dto.ReportResponse;
import com.projectmanagement.pmanage.exception.ForbiddenException;
import com.projectmanagement.pmanage.model.ProjectRole;
import com.projectmanagement.pmanage.model.User;
import com.projectmanagement.pmanage.repository.ProjectMemberRepository;
import com.projectmanagement.pmanage.service.PdfReportService;
import com.projectmanagement.pmanage.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for AI-powered project reports.
 * All endpoints are restricted to Project Managers only.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final PdfReportService pdfReportService;
    private final ProjectMemberRepository projectMemberRepository;

    /**
     * Generate a NEW AI-powered project report (JSON) and persist it.
     * Restricted to PROJECT_MANAGER role.
     */
    @PostMapping("/project/{projectId}")
    public ResponseEntity<ReportResponse> generateReport(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User currentUser) {

        verifyProjectManager(projectId, currentUser);
        ReportResponse report = reportService.generateReport(projectId, currentUser);
        return ResponseEntity.ok(report);
    }

    /**
     * List all saved reports for a project, ordered by newest first.
     * Restricted to PROJECT_MANAGER role.
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ReportResponse>> getReportHistory(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User currentUser) {

        verifyProjectManager(projectId, currentUser);
        List<ReportResponse> history = reportService.getReportHistory(projectId);
        return ResponseEntity.ok(history);
    }

    /**
     * Get a single saved report by its ID.
     * Restricted to PROJECT_MANAGER role.
     */
    @GetMapping("/project/{projectId}/{reportId}")
    public ResponseEntity<ReportResponse> getReport(
            @PathVariable UUID projectId,
            @PathVariable UUID reportId,
            @AuthenticationPrincipal User currentUser) {

        verifyProjectManager(projectId, currentUser);
        ReportResponse report = reportService.getReportById(reportId);
        return ResponseEntity.ok(report);
    }

    /**
     * Delete a saved report.
     * Restricted to PROJECT_MANAGER role.
     */
    @DeleteMapping("/project/{projectId}/{reportId}")
    public ResponseEntity<Void> deleteReport(
            @PathVariable UUID projectId,
            @PathVariable UUID reportId,
            @AuthenticationPrincipal User currentUser) {

        verifyProjectManager(projectId, currentUser);
        reportService.deleteReport(reportId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Generate a PDF from a saved report and download it.
     * Restricted to PROJECT_MANAGER role.
     */
    @GetMapping("/project/{projectId}/{reportId}/pdf")
    public ResponseEntity<byte[]> downloadPdfReport(
            @PathVariable UUID projectId,
            @PathVariable UUID reportId,
            @AuthenticationPrincipal User currentUser) {

        verifyProjectManager(projectId, currentUser);
        ReportResponse report = reportService.getReportById(reportId);
        byte[] pdfBytes = pdfReportService.generatePdf(report);

        String filename = report.getProjectKey() + "_Report.pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdfBytes);
    }

    /**
     * Verifies that the current user is a Project Manager for the given project.
     */
    private void verifyProjectManager(UUID projectId, User currentUser) {
        boolean isManager = projectMemberRepository
                .findByProjectIdAndUserId(projectId, currentUser.getId())
                .map(pm -> pm.getRole() == ProjectRole.PROJECT_MANAGER)
                .orElse(false);

        if (!isManager) {
            throw new ForbiddenException("Only Project Managers can generate reports");
        }
    }
}
