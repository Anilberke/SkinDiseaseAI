package com.ky.huaweiproject.dto;

import com.ky.huaweiproject.enumeration.Role;
import lombok.Builder;

import java.util.Date;

@Builder
public record UserDto(
        String name,
        String surname,
        String email,
        String TCNumber,
        String phoneNumber,
        String gender,
        String bloodType,
        Date birthDate,
        Role role,
        boolean hasUserAppliedKVKK
) {
}
