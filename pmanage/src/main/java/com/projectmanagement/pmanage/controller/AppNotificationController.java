package com.projectmanagement.pmanage.controller;

import com.projectmanagement.pmanage.model.AppNotification;
import com.projectmanagement.pmanage.model.User;
import com.projectmanagement.pmanage.repository.AppNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class AppNotificationController {

    private final AppNotificationRepository appNotificationRepository;

    @GetMapping
    public ResponseEntity<List<AppNotification>> getUnreadNotifications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(appNotificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(user.getId()));
    }

    @GetMapping("/all")
    public ResponseEntity<List<AppNotification>> getAllNotifications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(appNotificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        AppNotification notif = appNotificationRepository.findById(id).orElseThrow();
        if (!notif.getRecipient().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }
        notif.setRead(true);
        appNotificationRepository.save(notif);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/all")
    public ResponseEntity<?> clearAllNotifications(@AuthenticationPrincipal User user) {
        List<AppNotification> notifications = appNotificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());
        appNotificationRepository.deleteAll(notifications);
        return ResponseEntity.ok().build();
    }
}
