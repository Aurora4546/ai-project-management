package com.projectmanagement.pmanage.dto;

import com.projectmanagement.pmanage.model.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private UUID id;
    private String content;
    private String senderEmail;
    private String senderFirstName;
    private String senderLastName;
    private MessageType messageType;
    private String recipientEmail;
    private List<ChatFileResponse> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
