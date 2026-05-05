package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    Page<ChatMessage> findByProjectIdOrderByCreatedAtDesc(UUID projectId, Pageable pageable);
    
    @Query("SELECT m FROM ChatMessage m WHERE m.project.id = :projectId AND m.recipient IS NULL ORDER BY m.createdAt DESC")
    Page<ChatMessage> findByProjectIdAndRecipientIsNullOrderByCreatedAtDesc(UUID projectId, Pageable pageable);

    @Query("SELECT m FROM ChatMessage m WHERE m.project.id = :projectId AND (" +
           "(m.sender.id = :user1Id AND m.recipient.id = :user2Id) OR " +
           "(m.sender.id = :user2Id AND m.recipient.id = :user1Id)) " +
           "ORDER BY m.createdAt DESC")
    Page<ChatMessage> findDirectMessages(UUID projectId, Long user1Id, Long user2Id, Pageable pageable);

    @Query("SELECT m FROM ChatMessage m WHERE m.project.id = :projectId AND m.recipient IS NULL AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY m.createdAt DESC")
    List<ChatMessage> findByProjectIdAndContentContainingIgnoreCase(UUID projectId, String query);
    
    @Query("SELECT m FROM ChatMessage m WHERE m.project.id = :projectId AND (" +
           "(m.sender.id = :user1Id AND m.recipient.id = :user2Id) OR " +
           "(m.sender.id = :user2Id AND m.recipient.id = :user1Id)) " +
           "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY m.createdAt DESC")
    List<ChatMessage> searchDirectMessages(UUID projectId, Long user1Id, Long user2Id, String query);
    
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.project.id = :projectId AND m.recipient IS NULL AND m.createdAt > :date AND m.sender.id != :userId")
    long countUnreadChannelMessages(UUID projectId, java.time.LocalDateTime date, Long userId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.project.id = :projectId AND m.sender.id = :peerId AND m.recipient.id = :userId AND m.createdAt > :date")
    long countUnreadDirectMessages(UUID projectId, Long userId, Long peerId, java.time.LocalDateTime date);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.project.id = :projectId AND m.createdAt > :date AND m.sender.id != :userId AND (m.recipient IS NULL OR m.recipient.id = :userId)")
    long countUnreadMessages(UUID projectId, java.time.LocalDateTime date, Long userId);

    @Query("SELECT m.sender.id, COUNT(m) " +
           "FROM ChatMessage m " +
           "WHERE m.project.id = :projectId " +
           "AND m.recipient.id = :userId " +
           "AND m.createdAt > COALESCE((SELECT r.lastReadAt FROM ChatReadStatus r WHERE r.user.id = :userId AND r.projectId = :projectId AND r.peerId = m.sender.id), :defaultDate) " +
           "GROUP BY m.sender.id")
    List<Object[]> countUnreadDirectMessagesGrouped(UUID projectId, Long userId, java.time.LocalDateTime defaultDate);

    @Query("SELECT m FROM ChatMessage m WHERE m.project.id = :projectId AND m.recipient IS NULL ORDER BY m.createdAt DESC")
    List<ChatMessage> findRecentProjectMessages(UUID projectId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.project.id = :projectId AND m.recipient IS NULL")
    long countProjectMessages(UUID projectId);

    /**
     * Bulk-deletes all chat messages for a project.
     * Must be called before deleting the project to satisfy FK constraints.
     * Note: orphan attachments are cascade-deleted by the DB since ChatMessage
     * has CascadeType.ALL on attachments.
     */
    @Modifying
    @Query("DELETE FROM ChatMessage m WHERE m.project.id = :projectId")
    void deleteAllByProjectId(UUID projectId);
}
