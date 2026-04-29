package com.projectmanagement.pmanage.dto;

import com.projectmanagement.pmanage.model.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {
    @NotNull(message = "Project ID is required")
    private UUID projectId;

    @NotBlank(message = "Message content cannot be empty")
    private String content;

    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    private Long recipientId;
}
