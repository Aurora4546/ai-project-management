package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.config.JpaConfig;
import com.projectmanagement.pmanage.model.Project;
import com.projectmanagement.pmanage.model.ProjectMember;
import com.projectmanagement.pmanage.model.ProjectRole;
import com.projectmanagement.pmanage.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(JpaConfig.class)
@DisplayName("ProjectRepository Integration Tests")
class ProjectRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ProjectRepository projectRepository;

    @Test
    @DisplayName("Should find project by key")
    void shouldFindProjectByProjectKey() {
        // Given
        Project project = new Project();
        project.setName("Test Project");
        project.setProjectKey("TEST");
        entityManager.persist(project);
        entityManager.flush();

        // When
        Optional<Project> found = projectRepository.findByProjectKey("TEST");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Test Project");
    }

    @Test
    @DisplayName("Should check if project key exists")
    void shouldCheckIfExistsByProjectKey() {
        // Given
        Project project = new Project();
        project.setName("Existing Project");
        project.setProjectKey("EXST");
        entityManager.persist(project);
        entityManager.flush();

        // When
        boolean exists = projectRepository.existsByProjectKey("EXST");
        boolean notExists = projectRepository.existsByProjectKey("NONE");

        // Then
        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
    }

    @Test
    @DisplayName("Should find all projects by user email")
    void shouldFindAllByUserEmail() {
        // Given
        User user = User.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .password("password")
                .build();
        entityManager.persist(user);

        Project project1 = new Project();
        project1.setName("Project 1");
        project1.setProjectKey("PRJ1");
        entityManager.persist(project1);

        Project project2 = new Project();
        project2.setName("Project 2");
        project2.setProjectKey("PRJ2");
        entityManager.persist(project2);

        ProjectMember member1 = new ProjectMember();
        member1.setProject(project1);
        member1.setUser(user);
        member1.setRole(ProjectRole.PROJECT_MANAGER);
        entityManager.persist(member1);

        ProjectMember member2 = new ProjectMember();
        member2.setProject(project2);
        member2.setUser(user);
        member2.setRole(ProjectRole.PROJECT_MEMBER);
        entityManager.persist(member2);

        entityManager.flush();

        // When
        List<Project> projects = projectRepository.findAllByUserEmail("john@example.com");

        // Then
        assertThat(projects).hasSize(2);
        assertThat(projects).extracting(Project::getProjectKey).containsExactlyInAnyOrder("PRJ1", "PRJ2");
    }
}
