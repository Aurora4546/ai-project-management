package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.Issue;
import com.projectmanagement.pmanage.model.IssueType;
import com.projectmanagement.pmanage.model.IssueStatus;
import com.projectmanagement.pmanage.model.Project;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("IssueRepository Integration Tests")
class IssueRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private IssueRepository issueRepository;

    private Project testProject;

    @BeforeEach
    void setUp() {
        testProject = new Project();
        testProject.setName("Test Project");
        testProject.setProjectKey("TEST");
        entityManager.persist(testProject);
        entityManager.flush();
    }

    @Test
    @DisplayName("Should find issues by project ID ordered by position")
    void shouldFindByProjectIdOrderByPositionAsc() {
        // Given
        Issue issue1 = createIssue("Issue 1", "TEST-1", 2.0);
        Issue issue2 = createIssue("Issue 2", "TEST-2", 1.0);
        entityManager.persist(issue1);
        entityManager.persist(issue2);
        entityManager.flush();

        // When
        List<Issue> issues = issueRepository.findByProjectIdOrderByPositionAsc(testProject.getId());

        // Then
        assertThat(issues).hasSize(2);
        assertThat(issues.get(0).getIssueKey()).isEqualTo("TEST-2"); // Position 1.0
        assertThat(issues.get(1).getIssueKey()).isEqualTo("TEST-1"); // Position 2.0
    }

    @Test
    @DisplayName("Should find issue by project and issue key")
    void shouldFindByProjectAndIssueKey() {
        // Given
        Issue issue = createIssue("Target Issue", "TEST-123", 1.0);
        entityManager.persist(issue);
        entityManager.flush();

        // When
        Optional<Issue> found = issueRepository.findByProjectAndIssueKey(testProject, "TEST-123");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo("Target Issue");
    }

    @Test
    @DisplayName("Should find issues by epic ID")
    void shouldFindByEpicId() {
        // Given
        Issue epic = createIssue("Epic 1", "TEST-E1", 0.0);
        epic.setType(IssueType.EPIC);
        entityManager.persist(epic);

        Issue child = createIssue("Child Task", "TEST-C1", 1.0);
        child.setEpic(epic);
        entityManager.persist(child);
        entityManager.flush();

        // When
        List<Issue> issues = issueRepository.findByEpicId(epic.getId());

        // Then
        assertThat(issues).hasSize(1);
        assertThat(issues.get(0).getIssueKey()).isEqualTo("TEST-C1");
    }

    private Issue createIssue(String title, String key, Double position) {
        Issue issue = new Issue();
        issue.setTitle(title);
        issue.setIssueKey(key);
        issue.setPosition(position);
        issue.setProject(testProject);
        issue.setType(IssueType.TASK);
        issue.setStatus(IssueStatus.TODO);
        return issue;
    }
}
