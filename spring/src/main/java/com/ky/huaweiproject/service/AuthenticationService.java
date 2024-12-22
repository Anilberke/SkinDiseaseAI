package com.ky.huaweiproject.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ky.huaweiproject.enumeration.Role;
import com.ky.huaweiproject.enumeration.TokenType;
import com.ky.huaweiproject.model.Token;
import com.ky.huaweiproject.model.User;
import com.ky.huaweiproject.repository.TokenRepository;
import com.ky.huaweiproject.repository.UserRepository;
import com.ky.huaweiproject.request.LoginRequest;
import com.ky.huaweiproject.request.RegisterUserRequest;
import com.ky.huaweiproject.response.LoginResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@Service
public class AuthenticationService {
    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder userPasswordEncoder;
    private static final Logger logger = LogManager.getLogger(AuthenticationService.class);

    public AuthenticationService(UserRepository userRepository,
                                 TokenRepository tokenRepository,
                                 JwtService jwtService,
                                 AuthenticationManager authenticationManager,
                                 PasswordEncoder userPasswordEncoder
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userPasswordEncoder = userPasswordEncoder;
    }

    public LoginResponse registerUser(RegisterUserRequest request){
        logger.debug("Register started");
        if(isUserExists(request.email())){
            throw new RuntimeException("This user has already exists in system.");
        }


        User user = User.builder()
                .name(request.name())
                .surname(request.surname())
                .email(request.email())
                .TCNumber(request.TCNumber())
                .phoneNumber(request.phoneNumber())
                .gender(request.gender())
                .bloodType(request.bloodType())
                .birthDate(request.birthDate())
                .hasUserAppliedKVKK(request.hasUserAppliedKVKK())
                .createdDate(Timestamp.valueOf(LocalDateTime.now()))
                .password(userPasswordEncoder.encode(request.password()))
                .role(Role.valueOf(Role.USER.name()))
                .build();

        if(!request.hasUserAppliedKVKK()) {
            throw new RuntimeException("User must accept KVKK.");
        }

        User savedUser = userRepository.save(user);
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        saveUserToken(savedUser, jwtToken);


        return LoginResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    public LoginResponse login(LoginRequest loginRequest){
        System.out.println("Login started");
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    loginRequest.email(),
                    loginRequest.password()
            ));
            System.out.println("Authenticated");
        } catch (Exception e) {
            System.out.println("Authentication failed: " + e.getMessage());
            throw e; // rethrow the exception to handle it as per your application's requirements
        }

        User user = userRepository.findByEmail(loginRequest.email())
                .orElseThrow(() -> new UsernameNotFoundException("User could not found."));
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        revokeAllUserTokens(user);
        saveUserToken(user, jwtToken);
        System.out.println("Saved and revoked for user");

        return LoginResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    public void refreshToken(HttpServletRequest request, HttpServletResponse response) throws IOException {

        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        final String refreshToken;
        final String userEmail;
        if(authHeader == null || !authHeader.startsWith("Bearer ")){
            return;
        }
        refreshToken = authHeader.substring(7);
        userEmail = jwtService.extractUsername(refreshToken);
        if(userEmail != null){

            var user = this.userRepository.findByEmail(userEmail)
                    .orElseThrow();
            if(jwtService.isTokenValid(refreshToken, user)){
                var accessToken = jwtService.generateToken(user);
                revokeAllUserTokens(user);
                saveUserToken(user, accessToken);
                var authResponse = LoginResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .build();
                new ObjectMapper().writeValue(response.getOutputStream(), authResponse);
            }
        }

    }

    private boolean isUserExists(String mail){
        return userRepository.existsByEmail(mail);
    }

    private void saveUserToken(User user, String jwtToken) {
        var token = Token.builder()
                .user(user)
                .token(jwtToken)
                .tokenType(TokenType.BEARER)
                .revoked(false)
                .expired(false)
                .build();

        tokenRepository.save(token);
    }

    private void revokeAllUserTokens(User user){
        var validUserTokens = tokenRepository.findAllValidTokensByUser(user.getId());
        if(validUserTokens.isEmpty()){
            return;
        }
        validUserTokens.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });
        tokenRepository.saveAll(validUserTokens);
    }
}
