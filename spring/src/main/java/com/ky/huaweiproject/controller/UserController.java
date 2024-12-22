package com.ky.huaweiproject.controller;

import com.ky.huaweiproject.dto.UserDto;
import com.ky.huaweiproject.request.ChangePasswordRequest;
import com.ky.huaweiproject.request.UpdateUserRequest;
import com.ky.huaweiproject.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/v1/api/user")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/getUser/{mail}")
    public ResponseEntity<UserDto> getUser(@PathVariable String mail){
        return ResponseEntity.ok(userService.getUserByMail(mail));
    }

    @PutMapping("/updateUser")
    public ResponseEntity<UserDto> updateUser(@RequestBody UpdateUserRequest updateUserRequest,
                                              @RequestParam String mail){
        return ResponseEntity.ok(userService.updateUser(updateUserRequest, mail));
    }

    @PatchMapping("/changePassword")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request,
                                            Principal connectedUser){
        userService.changePassword(request, connectedUser);
        return ResponseEntity.ok().build();
    }

}
