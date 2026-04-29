package com.projectmanagement.pmanage.service;

import com.projectmanagement.pmanage.dto.AuthenticationRequest;
import com.projectmanagement.pmanage.dto.AuthenticationResponse;
import com.projectmanagement.pmanage.dto.RegisterRequest;
import com.projectmanagement.pmanage.model.User;
import com.projectmanagement.pmanage.repository.UserRepository;
import com.projectmanagement.pmanage.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

        private final UserRepository repository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        public AuthenticationResponse register(RegisterRequest request) {
                if (repository.existsByEmail(request.getEmail())) {
                        throw new com.projectmanagement.pmanage.exception.UserAlreadyExistsException(
                                        "This email is already in use. Please use a different one or log in.");
                }

                var user = User.builder()
                                .firstName(request.getFirstName())
                                .lastName(request.getLastName())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .build();

                repository.save(user);
                var jwtToken = jwtService.generateToken(user);
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .email(user.getEmail())
                                .firstName(user.getFirstName())
                                .lastName(user.getLastName())
                                .build();
        }

        public AuthenticationResponse authenticate(AuthenticationRequest request) {
                log.info("Login attempt for email: {}", request.getEmail());

                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));

                log.info("Password successfully verified for: {}", request.getEmail());

                var authUser = repository.findByEmail(request.getEmail())
                                .orElseThrow();
                var token = jwtService.generateToken(authUser);

                log.info("JWT Token :\n{}\ngenerated for: {}", token, request.getEmail());

                return AuthenticationResponse.builder()
                                .token(token)
                                .email(authUser.getEmail())
                                .firstName(authUser.getFirstName())
                                .lastName(authUser.getLastName())
                                .build();
        }

        public boolean checkEmailExists(String email) {
                return repository.existsByEmail(email);
        }
}
