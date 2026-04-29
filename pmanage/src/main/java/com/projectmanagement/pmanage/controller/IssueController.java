package com.projectmanagement.pmanage.controller;

import com.projectmanagement.pmanage.dto.*;
import com.projectmanagement.pmanage.model.User;
import com.projectmanagement.pmanage.service.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @PostMapping
    public ResponseEntity<IssueResponse> createIssue(
            @Valid @RequestBody IssueRequest request,
            @AuthenticationPrincipal User currentUser) {
        return new ResponseEntity<>(issueService.createIssue(request, currentUser), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<IssueResponse> updateIssue(
            @PathVariable UUID id,
            @Valid @RequestBody IssueRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(issueService.updateIssue(id, request, currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IssueResponse> getIssue(@PathVariable UUID id) {
        return ResponseEntity.ok(issueService.getIssue(id));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<IssueResponse>> getProjectIssues(@PathVariable UUID projectId) {
        return ResponseEntity.ok(issueService.getProjectIssues(projectId));
    }

    @GetMapping("/project/{projectId}/epics")
    public ResponseEntity<List<IssueResponse>> getProjectEpics(@PathVariable UUID projectId) {
        return ResponseEntity.ok(issueService.getEpicsByProject(projectId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIssue(@PathVariable UUID id) {
        issueService.deleteIssue(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User author) {
        return new ResponseEntity<>(issueService.addComment(id, request, author), HttpStatus.CREATED);
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable UUID id) {
        return ResponseEntity.ok(issueService.getComments(id));
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User author) {
        return ResponseEntity.ok(issueService.updateComment(commentId, request, author));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal User author) {
        issueService.deleteComment(commentId, author);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<HistoryResponse>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(issueService.getHistory(id));
    }

    @GetMapping("/project/{projectId}/labels")
    public ResponseEntity<List<LabelResponse>> getProjectLabels(@PathVariable UUID projectId) {
        return ResponseEntity.ok(issueService.getProjectLabels(projectId));
    }

    @PostMapping("/project/{projectId}/labels")
    public ResponseEntity<LabelResponse> createLabel(
            @PathVariable UUID projectId,
            @Valid @RequestBody LabelRequest request) {
        return new ResponseEntity<>(issueService.createLabel(projectId, request), HttpStatus.CREATED);
    }
}
