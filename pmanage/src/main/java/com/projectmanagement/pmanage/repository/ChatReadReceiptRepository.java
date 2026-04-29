package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.ChatReadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatReadReceiptRepository extends JpaRepository<ChatReadReceipt, UUID> {
    Optional<ChatReadReceipt> findByProjectIdAndUserId(UUID projectId, Long userId);
    List<ChatReadReceipt> findAllByProjectId(UUID projectId);
}
