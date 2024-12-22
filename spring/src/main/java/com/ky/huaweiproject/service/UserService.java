package com.ky.huaweiproject.service;

import com.ky.huaweiproject.dto.UserDto;
import com.ky.huaweiproject.mapper.UserMapper;
import com.ky.huaweiproject.model.User;
import com.ky.huaweiproject.repository.UserRepository;
import com.ky.huaweiproject.request.ChangePasswordRequest;
import com.ky.huaweiproject.request.UpdateUserRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.Principal;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder customerPasswordEncoder;

    public UserService(UserRepository userRepository,
                       UserMapper userMapper,
                       PasswordEncoder customerPasswordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.customerPasswordEncoder = customerPasswordEncoder;
    }

    public UserDto updateUser(UpdateUserRequest request, String mail){
        User user = userRepository.findByEmail(mail)
                .orElseThrow(() -> new RuntimeException("User could not found by this mail."));


        user.setName(request.name());
        user.setSurname(request.surname());
        user.setTCNumber(request.TCNumber());
        user.setPhoneNumber(request.phoneNumber());
        user.setBloodType(request.bloodType());
        user.setBirthDate(request.birthDate());


        userRepository.save(user);

        return userMapper.userToUserDtoMapper(user);
    }

    public void changePassword(ChangePasswordRequest request, Principal connectedUser) {
        var user = (User) ((UsernamePasswordAuthenticationToken)connectedUser).getPrincipal();
        //check if the current password is correct.

        if(!customerPasswordEncoder.matches(request.currentPassword(), user.getPassword())){

            throw new IllegalStateException("Wrong Password...");
        }
        if(!request.newPassword().equals(request.confirmNewPassword())){
            throw new IllegalStateException("Passwords do not match with each other...");
        }
        //update the password
        user.setPassword(customerPasswordEncoder.encode(request.newPassword()));

        userRepository.save(user);
    }

    public UserDto getUserByMail(String mail){
        User user = userRepository.findByEmail(mail)
                .orElseThrow(()  -> new RuntimeException("User could not found by mail."));

        return userMapper.userToUserDtoMapper(user);
    }


}
