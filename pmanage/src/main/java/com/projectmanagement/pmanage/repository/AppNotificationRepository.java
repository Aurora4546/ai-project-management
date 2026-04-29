package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, UUID> {
    List<AppNotification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    List<AppNotification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(Long recipientId);
}
