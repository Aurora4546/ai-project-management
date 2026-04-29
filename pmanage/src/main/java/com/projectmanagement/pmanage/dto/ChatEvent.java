package com.projectmanagement.pmanage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatEvent {
    public enum EventType {
        MESSAGE_UPDATED,
        MESSAGE_DELETED
    }

    private EventType type;
    private UUID messageId;
    private ChatMessageResponse message; // Optional, used for updates
    private UUID projectId;
}
