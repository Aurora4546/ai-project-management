package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.User;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY u.firstName ASC")
    List<User> searchByQuery(@Param("query") String query, Pageable pageable);

    default List<User> searchByQuery(String query) {
        return searchByQuery(query, PageRequest.of(0, 10));
    }

    @Modifying
    @Query("UPDATE User u SET u.lastSeenAt = :lastSeenAt WHERE u.id = :userId")
    void updateLastSeenAt(@Param("userId") Long userId, @Param("lastSeenAt") LocalDateTime lastSeenAt);

    @Query("SELECT pm.user FROM ProjectMember pm WHERE pm.project.id = :projectId AND pm.user.lastSeenAt > :threshold")
    List<User> findOnlineUsersByProjectId(@Param("projectId") UUID projectId, @Param("threshold") LocalDateTime threshold);
}
