package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("UserRepository Integration Tests")
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should find user by email")
    void shouldFindUserByEmail() {
        // Given
        User user = User.builder()
                .firstName("Jane")
                .lastName("Smith")
                .email("jane@example.com")
                .password("securePass")
                .build();
        entityManager.persist(user);
        entityManager.flush();

        // When
        Optional<User> found = userRepository.findByEmail("jane@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getFirstName()).isEqualTo("Jane");
    }

    @Test
    @DisplayName("Should search users by name or email query")
    void shouldSearchByQuery() {
        // Given
        User user1 = User.builder().firstName("Alice").lastName("Wonder").email("alice@wonder.com").password("pw").build();
        User user2 = User.builder().firstName("Bob").lastName("Builder").email("bob@builder.com").password("pw").build();
        entityManager.persist(user1);
        entityManager.persist(user2);
        entityManager.flush();

        // When
        List<User> results = userRepository.searchByQuery("Wonder", PageRequest.of(0, 10));

        // Then
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getFirstName()).isEqualTo("Alice");
    }

    @Test
    @DisplayName("Should check if email exists")
    void shouldCheckIfExistsByEmail() {
        // Given
        User user = User.builder().firstName("Check").lastName("Me").email("exists@test.com").password("pw").build();
        entityManager.persist(user);
        entityManager.flush();

        // When
        boolean exists = userRepository.existsByEmail("exists@test.com");
        boolean notExists = userRepository.existsByEmail("not@test.com");

        // Then
        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
    }
}
