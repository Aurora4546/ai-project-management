package com.projectmanagement.pmanage.controller;

import com.projectmanagement.pmanage.dto.ChatMessageRequest;
import com.projectmanagement.pmanage.dto.ChatTypingEvent;
import com.projectmanagement.pmanage.model.User;
import com.projectmanagement.pmanage.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send/{projectId}")
    public void sendMessage(@DestinationVariable UUID projectId, 
                            @Payload ChatMessageRequest request, 
                            SimpMessageHeaderAccessor headerAccessor) {
        User user = getUserFromAccessor(headerAccessor);
        request.setProjectId(projectId);
        chatService.sendMessage(request, user);
    }

    @MessageMapping("/chat.typing/{projectId}")
    public void sendTyping(@DestinationVariable UUID projectId, 
                           @Payload ChatTypingEvent event, 
                           SimpMessageHeaderAccessor headerAccessor) {
        User user = getUserFromAccessor(headerAccessor);
        event.setProjectId(projectId);
        event.setUserEmail(user.getEmail());
        event.setFirstName(user.getFirstName());
        messagingTemplate.convertAndSend("/topic/chat/" + projectId + "/typing", event);
    }

    @MessageMapping("/chat.presence")
    public void updatePresence(SimpMessageHeaderAccessor headerAccessor) {
        User user = getUserFromAccessor(headerAccessor);
        chatService.updatePresence(user);
    }

    private User getUserFromAccessor(SimpMessageHeaderAccessor headerAccessor) {
        UsernamePasswordAuthenticationToken token = (UsernamePasswordAuthenticationToken) headerAccessor.getUser();
        if (token != null) {
            return (User) token.getPrincipal();
        }
        throw new RuntimeException("Unauthorized WebSocket action");
    }
}
