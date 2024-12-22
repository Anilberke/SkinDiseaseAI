package com.ky.huaweiproject.mapper;

import com.ky.huaweiproject.dto.UserDto;
import com.ky.huaweiproject.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserDto userToUserDtoMapper(User user){
        return UserDto.builder()
                .name(user.getName())
                .surname(user.getSurname())
                .email(user.getEmail())
                .TCNumber(user.getTCNumber())
                .phoneNumber(user.getPhoneNumber())
                .gender(user.getGender())
                .bloodType(user.getBloodType())
                .birthDate(user.getBirthDate())
                .role(user.getRole())
                .hasUserAppliedKVKK(user.isHasUserAppliedKVKK())
                .build();
    }
}
