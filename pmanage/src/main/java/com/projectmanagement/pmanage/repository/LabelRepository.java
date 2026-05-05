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

    /**
     * Bulk-deletes all labels for a project before project deletion.
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Label l WHERE l.project.id = :projectId")
    void deleteAllByProjectId(UUID projectId);
}
