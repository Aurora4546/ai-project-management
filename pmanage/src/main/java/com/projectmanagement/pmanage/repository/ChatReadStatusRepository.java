package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.ChatReadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatReadStatusRepository extends JpaRepository<ChatReadStatus, UUID> {
    List<ChatReadStatus> findByUserId(Long userId);
    List<ChatReadStatus> findByUserIdAndProjectId(Long userId, UUID projectId);
    Optional<ChatReadStatus> findByUserIdAndProjectIdAndPeerId(Long userId, UUID projectId, Long peerId);
}
