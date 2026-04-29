package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.ChatFileAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatFileAttachmentRepository extends JpaRepository<ChatFileAttachment, UUID> {
    List<ChatFileAttachment> findByChatMessageId(UUID chatMessageId);

    @Query("SELECT a FROM ChatFileAttachment a JOIN a.chatMessage m WHERE m.project.id = :projectId AND m.recipient IS NULL AND LOWER(a.fileName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<ChatFileAttachment> searchByProjectIdAndFileName(@Param("projectId") UUID projectId, @Param("query") String query);

    @Query("SELECT a FROM ChatFileAttachment a JOIN a.chatMessage m WHERE m.project.id = :projectId AND m.recipient IS NULL ORDER BY m.createdAt DESC")
    List<ChatFileAttachment> findByProjectIdOrderByCreatedAtDesc(@Param("projectId") UUID projectId);

    @Query("SELECT a FROM ChatFileAttachment a JOIN a.chatMessage m WHERE m.project.id = :projectId AND (" +
           "(m.sender.id = :user1Id AND m.recipient.id = :user2Id) OR " +
           "(m.sender.id = :user2Id AND m.recipient.id = :user1Id)) " +
           "ORDER BY a.createdAt DESC")
    List<ChatFileAttachment> findDirectFiles(UUID projectId, Long user1Id, Long user2Id);

    @Query("SELECT a FROM ChatFileAttachment a JOIN a.chatMessage m WHERE m.project.id = :projectId AND (" +
           "(m.sender.id = :user1Id AND m.recipient.id = :user2Id) OR " +
           "(m.sender.id = :user2Id AND m.recipient.id = :user1Id)) " +
           "AND LOWER(a.fileName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY a.createdAt DESC")
    List<ChatFileAttachment> searchDirectFiles(UUID projectId, Long user1Id, Long user2Id, String query);
}
