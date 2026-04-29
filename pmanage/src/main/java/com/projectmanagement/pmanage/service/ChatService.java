package com.projectmanagement.pmanage.service;

import com.projectmanagement.pmanage.dto.ChatMessageRequest;
import com.projectmanagement.pmanage.dto.ChatMessageResponse;
import com.projectmanagement.pmanage.dto.ChatFileResponse;
import com.projectmanagement.pmanage.dto.ChatNotificationEvent;
import com.projectmanagement.pmanage.dto.ChatEvent;
import com.projectmanagement.pmanage.dto.UserSearchResponse;
import com.projectmanagement.pmanage.model.ChatMessage;
import com.projectmanagement.pmanage.model.ChatFileAttachment;
import com.projectmanagement.pmanage.model.Project;
import com.projectmanagement.pmanage.model.User;
import com.projectmanagement.pmanage.model.MessageType;
import com.projectmanagement.pmanage.repository.ChatMessageRepository;
import com.projectmanagement.pmanage.repository.ChatFileAttachmentRepository;
import com.projectmanagement.pmanage.repository.ProjectRepository;
import com.projectmanagement.pmanage.repository.UserRepository;
import com.projectmanagement.pmanage.repository.ProjectMemberRepository;
import com.projectmanagement.pmanage.repository.AppNotificationRepository;
import com.projectmanagement.pmanage.model.AppNotification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import com.projectmanagement.pmanage.model.ChatReadStatus;
import com.projectmanagement.pmanage.repository.ChatReadStatusRepository;
import com.projectmanagement.pmanage.dto.UnreadCountsResponse;


@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository messageRepository;
    private final ChatFileAttachmentRepository attachmentRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AppNotificationRepository appNotificationRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ChatReadStatusRepository readStatusRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatFileService chatFileService;

    @Transactional
    public ChatMessageResponse sendMessage(ChatMessageRequest request, User sender) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        User recipient = null;
        if (request.getRecipientId() != null) {
            recipient = userRepository.findById(request.getRecipientId())
                    .orElseThrow(() -> new RuntimeException("Recipient not found"));
        }

        ChatMessage message = ChatMessage.builder()
                .project(project)
                .sender(sender)
                .recipient(recipient)
                .content(request.getContent())
                .messageType(request.getMessageType() != null ? request.getMessageType() : MessageType.TEXT)
                .build();

        ChatMessage savedMessage = messageRepository.save(message);
        ChatMessageResponse response = mapToResponse(savedMessage);

        broadcastMessage(project, recipient, response);
        broadcastNotification(project, sender, savedMessage);
        
        processMentions(project, sender, savedMessage);

        return response;
    }

    private void processMentions(Project project, User sender, ChatMessage message) {
        if (message.getContent() == null) return;
        String content = message.getContent();

        project.getMembers().forEach(member -> {
            User u = member.getUser();
            if (u.getId().equals(sender.getId())) return;

            String mentionPattern1 = "@[" + u.getFirstName() + "]";
            String mentionPattern2 = "@[" + u.getFirstName() + " " + u.getLastName() + "]";

            if (content.contains(mentionPattern1) || content.contains(mentionPattern2) || 
                content.contains("@" + u.getFirstName()) || content.contains("@" + u.getFirstName() + " " + u.getLastName())) {
                String contentSnippet = content.length() > 50 ? content.substring(0, 47) + "..." : content;

                AppNotification notif = new AppNotification();
                notif.setRecipient(u);
                notif.setSenderEmail(sender.getEmail());
                notif.setSenderName(sender.getFirstName() + " " + sender.getLastName());
                notif.setTitle("Mentioned in Chat");
                notif.setMessage(sender.getFirstName() + " " + sender.getLastName() + " mentioned you: " + contentSnippet);
                notif.setRelatedProjectId(project.getId());
                notif.setMessageId(message.getId());
                notif.setDirect(message.getRecipient() != null);
                notif.setType("MENTION");
                notif.setRead(false);
                appNotificationRepository.save(notif);
                
                // Real-time push to the user's active session for the bell icon
                messagingTemplate.convertAndSendToUser(u.getEmail(), "/queue/app-notifications", notif);
            }
        });
    }

    @Transactional
    public ChatMessageResponse uploadFile(UUID projectId, MultipartFile file, User sender, Long recipientId) throws IOException {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        User recipient = null;
        if (recipientId != null) {
            recipient = userRepository.findById(recipientId)
                    .orElseThrow(() -> new RuntimeException("Recipient not found"));
        }

        ChatMessage message = ChatMessage.builder()
                .project(project)
                .sender(sender)
                .recipient(recipient)
                .content("Shared a file: " + file.getOriginalFilename())
                .messageType(MessageType.FILE)
                .build();

        ChatMessage savedMessage = messageRepository.save(message);
        ChatFileAttachment attachment = chatFileService.storeFile(file, savedMessage);
        
        // Ensure attachments are loaded for the response
        List<ChatFileAttachment> attachments = new ArrayList<>();
        attachments.add(attachment);
        savedMessage.setAttachments(attachments);

        ChatMessageResponse response = mapToResponse(savedMessage);

        broadcastMessage(project, recipient, response);
        broadcastNotification(project, sender, savedMessage);

        return response;
    }

    @Transactional
    public ChatMessageResponse updateMessage(UUID messageId, String newContent, User user) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSender().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You can only edit your own messages");
        }

        message.setContent(newContent);
        ChatMessage savedMessage = messageRepository.save(message);
        ChatMessageResponse response = mapToResponse(savedMessage);

        // Broadcast update event
        ChatEvent event = ChatEvent.builder()
                .type(ChatEvent.EventType.MESSAGE_UPDATED)
                .messageId(messageId)
                .message(response)
                .projectId(message.getProject().getId())
                .build();
        
        broadcastEvent(message.getProject(), message.getSender(), message.getRecipient(), event);

        return response;
    }

    @Transactional
    public void deleteMessage(UUID messageId, User user) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSender().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You can only delete your own messages");
        }

        UUID projectId = message.getProject().getId();
        User sender = message.getSender();
        User recipient = message.getRecipient();
        messageRepository.delete(message);

        // Broadcast delete event
        ChatEvent event = ChatEvent.builder()
                .type(ChatEvent.EventType.MESSAGE_DELETED)
                .messageId(messageId)
                .projectId(projectId)
                .build();
        
        broadcastEvent(message.getProject(), sender, recipient, event);
    }

    private void broadcastMessage(Project project, User recipient, ChatMessageResponse response) {
        if (recipient == null) {
            messagingTemplate.convertAndSend("/topic/chat/" + project.getId(), response);
        } else {
            messagingTemplate.convertAndSendToUser(response.getSenderEmail(), "/queue/chat", response);
            messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/chat", response);
        }
    }

    private void broadcastEvent(Project project, User sender, User recipient, ChatEvent event) {
        if (recipient == null) {
            messagingTemplate.convertAndSend("/topic/chat/" + project.getId() + "/events", event);
        } else {
            // Ensure both sender and recipient in a DM receive the event
            messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/chat/events", event);
            messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/chat/events", event);
        }
    }

    private void broadcastNotification(Project project, User sender, ChatMessage message) {
        ChatNotificationEvent notification = ChatNotificationEvent.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .senderName(sender.getFirstName() + " " + sender.getLastName())
                .senderEmail(sender.getEmail())
                .messageId(message.getId())
                .isDirect(message.getRecipient() != null)
                .messagePreview(message.getContent() != null ? (message.getContent().length() > 50 ? message.getContent().substring(0, 47) + "..." : message.getContent()) : "")
                .timestamp(LocalDateTime.now())
                .build();
                
        project.getMembers().forEach(member -> {
            User u = member.getUser();
            if (!u.getId().equals(sender.getId())) {
                messagingTemplate.convertAndSendToUser(u.getEmail(), "/queue/notifications", notification);
            }
        });
    }

    public List<ChatMessageResponse> getMessageHistory(UUID projectId, int page, int size) {
        Page<ChatMessage> messages = messageRepository.findByProjectIdAndRecipientIsNullOrderByCreatedAtDesc(
                projectId, PageRequest.of(page, size));
        return messages.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ChatMessageResponse> getDirectMessageHistory(UUID projectId, Long user1Id, Long user2Id, int page, int size) {
        Page<ChatMessage> messages = messageRepository.findDirectMessages(
                projectId, user1Id, user2Id, PageRequest.of(page, size));
        return messages.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ChatMessageResponse> searchMessages(UUID projectId, String query) {
        return messageRepository.findByProjectIdAndContentContainingIgnoreCase(projectId, query)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ChatFileResponse> searchFiles(UUID projectId, String query) {
        return attachmentRepository.searchByProjectIdAndFileName(projectId, query)
                .stream()
                .map(this::mapToFileResponse)
                .collect(Collectors.toList());
    }

    public List<ChatFileResponse> getProjectFiles(UUID projectId) {
        return attachmentRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::mapToFileResponse)
                .collect(Collectors.toList());
    }

    public List<ChatMessageResponse> searchDirectMessages(UUID projectId, Long user1Id, Long user2Id, String query) {
        return messageRepository.searchDirectMessages(projectId, user1Id, user2Id, query)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ChatFileResponse> searchDirectFiles(UUID projectId, Long user1Id, Long user2Id, String query) {
        return attachmentRepository.searchDirectFiles(projectId, user1Id, user2Id, query)
                .stream()
                .map(this::mapToFileResponse)
                .collect(Collectors.toList());
    }

    public List<ChatFileResponse> getDirectFiles(UUID projectId, Long user1Id, Long user2Id) {
        return attachmentRepository.findDirectFiles(projectId, user1Id, user2Id)
                .stream()
                .map(this::mapToFileResponse)
                .collect(Collectors.toList());
    }



    public List<UserSearchResponse> getOnlineUsers(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        // Online threshold: 1 minute
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(1);

        return project.getMembers().stream()
                .map(pm -> pm.getUser())
                .filter(u -> u.getLastSeenAt() != null && u.getLastSeenAt().isAfter(threshold))
                .map(u -> UserSearchResponse.builder()
                        .id(u.getId())
                        .email(u.getEmail())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void updatePresence(User user) {
        User u = userRepository.findById(user.getId()).orElse(user);
        u.setLastSeenAt(LocalDateTime.now());
        userRepository.save(u);
    }

    private ChatMessageResponse mapToResponse(ChatMessage message) {
        boolean isEdited = message.getUpdatedAt() != null && 
                          message.getCreatedAt() != null && 
                          !message.getUpdatedAt().isEqual(message.getCreatedAt());

        return ChatMessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .senderEmail(message.getSender().getEmail())
                .senderFirstName(message.getSender().getFirstName())
                .senderLastName(message.getSender().getLastName())
                .recipientEmail(message.getRecipient() != null ? message.getRecipient().getEmail() : null)
                .messageType(message.getMessageType())
                .createdAt(message.getCreatedAt())
                .updatedAt(isEdited ? message.getUpdatedAt() : null)
                .attachments(message.getAttachments() != null ? 
                        message.getAttachments().stream().map(this::mapToFileResponse).collect(Collectors.toList()) : 
                        List.of())
                .build();
    }

    private ChatFileResponse mapToFileResponse(ChatFileAttachment attachment) {
        ChatFileResponse attResponse = new ChatFileResponse();
        attResponse.setId(attachment.getId());
        attResponse.setFileName(attachment.getFileName());
        attResponse.setFileType(attachment.getFileType());
        attResponse.setFileSize(attachment.getFileSize());
        attResponse.setDownloadUrl("/api/chat/files/" + attachment.getId() + "/download");
        attResponse.setCreatedAt(attachment.getCreatedAt());
        if (attachment.getChatMessage() != null) {
            attResponse.setMessageId(attachment.getChatMessage().getId());
        }
        return attResponse;
    }

    public UnreadCountsResponse getUnreadChatCounts(User user) {
        Map<UUID, Long> projectCounts = new java.util.HashMap<>();
        Map<UUID, Map<Long, Long>> dmCounts = new java.util.HashMap<>();

        // Get all projects the user is a member of
        projectMemberRepository.findByUserId(user.getId()).forEach(pm -> {
            UUID projectId = pm.getProject().getId();
            
            // 1. Calculate General Channel Unread Count
            LocalDateTime generalLastRead = readStatusRepository.findByUserIdAndProjectIdAndPeerId(user.getId(), projectId, null)
                .map(ChatReadStatus::getLastReadAt)
                .orElse(LocalDateTime.of(2000, 1, 1, 0, 0));
            
            long channelCount = messageRepository.countUnreadChannelMessages(projectId, generalLastRead, user.getId());
            if (channelCount > 0) projectCounts.put(projectId, channelCount);

            // 2. Calculate DM Unread Counts for each member in this project
            Map<Long, Long> projectDms = new java.util.HashMap<>();
            pm.getProject().getMembers().forEach(member -> {
                User peer = member.getUser();
                if (peer.getId().equals(user.getId())) return;

                LocalDateTime dmLastRead = readStatusRepository.findByUserIdAndProjectIdAndPeerId(user.getId(), projectId, peer.getId())
                    .map(ChatReadStatus::getLastReadAt)
                    .orElse(LocalDateTime.of(2000, 1, 1, 0, 0));
                
                long dmCount = messageRepository.countUnreadDirectMessages(projectId, user.getId(), peer.getId(), dmLastRead);
                if (dmCount > 0) projectDms.put(peer.getId(), dmCount);
            });
            if (!projectDms.isEmpty()) dmCounts.put(projectId, projectDms);
        });

        return UnreadCountsResponse.builder()
                .projects(projectCounts)
                .dms(dmCounts)
                .build();
    }

    @Transactional
    public void markChatAsRead(UUID projectId, User user, Long recipientId) {
        ChatReadStatus status = readStatusRepository.findByUserIdAndProjectIdAndPeerId(user.getId(), projectId, recipientId)
                .orElse(ChatReadStatus.builder()
                        .user(user)
                        .projectId(projectId)
                        .peerId(recipientId)
                        .build());
        
        status.setLastReadAt(LocalDateTime.now());
        readStatusRepository.save(status);

        // Also update the legacy field if it's the general channel for compatibility
        if (recipientId == null) {
            projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .ifPresent(pm -> {
                    pm.setLastReadChatAt(LocalDateTime.now());
                    projectMemberRepository.save(pm);
                });
        }
    }
}
