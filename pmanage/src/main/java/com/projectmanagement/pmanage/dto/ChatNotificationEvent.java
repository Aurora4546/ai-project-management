package com.projectmanagement.pmanage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatNotificationEvent {
    private UUID projectId;
    private String projectName;
    private String senderName;
    private String senderEmail;
    private String messagePreview;
    private UUID messageId;
    private boolean isDirect;
    private LocalDateTime timestamp;
}
