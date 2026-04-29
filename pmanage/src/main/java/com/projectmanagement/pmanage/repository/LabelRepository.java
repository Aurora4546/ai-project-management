package com.projectmanagement.pmanage.repository;

import com.projectmanagement.pmanage.model.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {
    List<Label> findByProjectIdOrderByNameAsc(UUID projectId);
    Optional<Label> findByNameAndProjectId(String name, UUID projectId);
}
