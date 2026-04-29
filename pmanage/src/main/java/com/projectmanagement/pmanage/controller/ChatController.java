package com.projectmanagement.pmanage.controller;

import com.projectmanagement.pmanage.dto.ChatMessageResponse;
import com.projectmanagement.pmanage.dto.ChatFileResponse;
import com.projectmanagement.pmanage.dto.UserSearchResponse;
import com.projectmanagement.pmanage.dto.UnreadCountsResponse;
import com.projectmanagement.pmanage.model.ChatFileAttachment;
import com.projectmanagement.pmanage.model.User;
import com.projectmanagement.pmanage.service.ChatFileService;
import com.projectmanagement.pmanage.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ChatFileService chatFileService;

    @GetMapping("/{projectId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessageHistory(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(chatService.getMessageHistory(projectId, page, size));
    }

    @GetMapping("/{projectId}/messages/direct/{targetUserId}")
    public ResponseEntity<List<ChatMessageResponse>> getDirectMessageHistory(
            @PathVariable UUID projectId,
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(chatService.getDirectMessageHistory(projectId, user.getId(), targetUserId, page, size));
    }

    @PostMapping("/{projectId}/upload")
    public ResponseEntity<ChatMessageResponse> uploadFile(
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long recipientId,
            @AuthenticationPrincipal User sender) throws IOException {
        return ResponseEntity.ok(chatService.uploadFile(projectId, file, sender, recipientId));
    }

    @PutMapping("/{projectId}/messages/{messageId}")
    public ResponseEntity<ChatMessageResponse> updateMessage(
            @PathVariable UUID projectId,
            @PathVariable UUID messageId,
            @RequestBody String content,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.updateMessage(messageId, content, user));
    }

    @DeleteMapping("/{projectId}/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable UUID projectId,
            @PathVariable UUID messageId,
            @AuthenticationPrincipal User user) {
        chatService.deleteMessage(messageId, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{projectId}/search")
    public ResponseEntity<List<ChatMessageResponse>> searchMessages(
            @PathVariable UUID projectId,
            @RequestParam String q) {
        return ResponseEntity.ok(chatService.searchMessages(projectId, q));
    }

    @GetMapping("/{projectId}/files/search")
    public ResponseEntity<List<ChatFileResponse>> searchFiles(
            @PathVariable UUID projectId,
            @RequestParam String q) {
        return ResponseEntity.ok(chatService.searchFiles(projectId, q));
    }

    @GetMapping("/{projectId}/files")
    public ResponseEntity<List<ChatFileResponse>> getProjectFiles(@PathVariable UUID projectId) {
        return ResponseEntity.ok(chatService.getProjectFiles(projectId));
    }

    @GetMapping("/{projectId}/search/direct/{targetUserId}")
    public ResponseEntity<List<ChatMessageResponse>> searchDirectMessages(
            @PathVariable UUID projectId,
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal User user,
            @RequestParam String q) {
        return ResponseEntity.ok(chatService.searchDirectMessages(projectId, user.getId(), targetUserId, q));
    }

    @GetMapping("/{projectId}/files/direct/{targetUserId}/search")
    public ResponseEntity<List<ChatFileResponse>> searchDirectFiles(
            @PathVariable UUID projectId,
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal User user,
            @RequestParam String q) {
        return ResponseEntity.ok(chatService.searchDirectFiles(projectId, user.getId(), targetUserId, q));
    }

    @GetMapping("/{projectId}/files/direct/{targetUserId}")
    public ResponseEntity<List<ChatFileResponse>> getDirectFiles(
            @PathVariable UUID projectId,
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.getDirectFiles(projectId, user.getId(), targetUserId));
    }

    @GetMapping("/{projectId}/online-users")
    public ResponseEntity<List<UserSearchResponse>> getOnlineUsers(@PathVariable UUID projectId) {
        return ResponseEntity.ok(chatService.getOnlineUsers(projectId));
    }

    @GetMapping("/files/{attachmentId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID attachmentId) {
        try {
            ChatFileAttachment attachment = chatFileService.getAttachment(attachmentId);
            Path filePath = chatFileService.getFilePath(attachmentId);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                        .contentType(MediaType.parseMediaType(attachment.getFileType()))
                        .body(resource);
            } else {
                throw new RuntimeException("Could not read the file!");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }

    @GetMapping("/unread")
    public ResponseEntity<UnreadCountsResponse> getUnreadChatCounts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(chatService.getUnreadChatCounts(user));
    }
    
    @PutMapping("/projects/{projectId}/chat/read")
    public ResponseEntity<?> markChatAsRead(
            @PathVariable UUID projectId,
            @RequestParam(required = false) Long recipientId,
            @AuthenticationPrincipal User user) {
        chatService.markChatAsRead(projectId, user, recipientId);
        return ResponseEntity.ok().build();
    }
}
