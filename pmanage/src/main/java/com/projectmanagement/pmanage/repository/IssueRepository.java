package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.Issue;
import com.projectmanagement.pmanage.model.Project;
import com.projectmanagement.pmanage.model.IssueType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IssueRepository extends JpaRepository<Issue, UUID> {
    List<Issue> findByProjectIdOrderByPositionAsc(UUID projectId);
    List<Issue> findByProjectIdAndTypeOrderByPositionAsc(UUID projectId, IssueType type);

    Optional<Issue> findByProjectAndIssueKey(Project project, String issueKey);
    List<Issue> findByEpicId(UUID epicId);
    List<Issue> findByParentId(UUID parentId);
}
