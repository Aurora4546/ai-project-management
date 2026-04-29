package com.projectmanagement.pmanage.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_read_status")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatReadStatus extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "peer_id")
    private Long peerId; // null for general channel, else the other user's ID

    @Column(name = "last_read_at", nullable = false)
    private LocalDateTime lastReadAt;
}
