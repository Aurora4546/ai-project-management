package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByProjectKey(String projectKey);
    boolean existsByProjectKey(String projectKey);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Project p JOIN p.members pm WHERE pm.user.email = :email")
    java.util.List<Project> findAllByUserEmail(@org.springframework.data.repository.query.Param("email") String email);
}
