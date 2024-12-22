package com.ky.huaweiproject.controller;

import com.ky.huaweiproject.request.LoginRequest;
import com.ky.huaweiproject.request.RegisterUserRequest;
import com.ky.huaweiproject.response.LoginResponse;
import com.ky.huaweiproject.service.AuthenticationService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/api/auth")
public class AuthenticationController {
    private final AuthenticationService authenticationService;
    private static final Logger logger = LogManager.getLogger(AuthenticationController.class);


    public AuthenticationController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterUserRequest request){
        return ResponseEntity.ok(authenticationService.registerUser(request));

    }

    @PostMapping("/getHello")
    public void hello(@RequestBody String message){
        System.out.println(message);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest){
        logger.debug("Login from controller");
        return ResponseEntity.ok(authenticationService.login(loginRequest));
    }
}
