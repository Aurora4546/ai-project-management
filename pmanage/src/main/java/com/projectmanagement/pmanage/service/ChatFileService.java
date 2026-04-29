package com.projectmanagement.pmanage.service;

import com.projectmanagement.pmanage.config.ChatProperties;
import com.projectmanagement.pmanage.model.ChatFileAttachment;
import com.projectmanagement.pmanage.model.ChatMessage;
import com.projectmanagement.pmanage.repository.ChatFileAttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatFileService {

    private final ChatProperties chatProperties;
    private final ChatFileAttachmentRepository attachmentRepository;

    public ChatFileAttachment storeFile(MultipartFile file, ChatMessage chatMessage) throws IOException {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = "";
        int i = fileName.lastIndexOf('.');
        if (i > 0) {
            extension = fileName.substring(i);
        }

        UUID fileId = UUID.randomUUID();
        String storedFileName = fileId.toString() + extension;

        Path rootPath = Paths.get(chatProperties.getUploadDir()).toAbsolutePath().normalize();
        Path projectPath = rootPath.resolve(chatMessage.getProject().getId().toString());
        if (!Files.exists(projectPath)) {
            Files.createDirectories(projectPath);
        }

        Path targetLocation = projectPath.resolve(storedFileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        ChatFileAttachment attachment = ChatFileAttachment.builder()
                .chatMessage(chatMessage)
                .fileName(fileName)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .storagePath(targetLocation.toAbsolutePath().toString()) // Store absolute path
                .build();

        return attachmentRepository.save(attachment);
    }

    public Path getFilePath(UUID attachmentId) {
        ChatFileAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));
        
        Path storedPath = Paths.get(attachment.getStoragePath());
        if (!storedPath.isAbsolute()) {
            // Fallback for existing records with relative paths
            return Paths.get(chatProperties.getUploadDir()).toAbsolutePath().resolve(storedPath).normalize();
        }
        return storedPath;
    }

    public ChatFileAttachment getAttachment(UUID attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));
    }
}
