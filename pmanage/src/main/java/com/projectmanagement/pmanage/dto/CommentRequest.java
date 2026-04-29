package com.projectmanagement.pmanage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class CommentRequest {
    @NotBlank(message = "Comment content is required")
    private String content;

    @NotNull(message = "Issue ID is required")
    private UUID issueId;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public UUID getIssueId() { return issueId; }
    public void setIssueId(UUID issueId) { this.issueId = issueId; }
}
