package com.projectmanagement.pmanage.controller;

import com.projectmanagement.pmanage.dto.UserSearchResponse;
import com.projectmanagement.pmanage.model.User;
import com.projectmanagement.pmanage.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(@RequestParam String q) {
        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }

        List<User> users = userRepository.searchByQuery(q.trim());

        List<UserSearchResponse> response = users.stream()
                .map(u -> UserSearchResponse.builder()
                        .id(u.getId())
                        .email(u.getEmail())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
