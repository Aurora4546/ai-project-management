package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.IssueHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IssueHistoryRepository extends JpaRepository<IssueHistory, UUID> {
    List<IssueHistory> findByIssueIdOrderByCreatedAtDesc(UUID issueId);
}
