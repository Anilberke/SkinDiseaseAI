package com.ky.huaweiproject.request;

import java.util.Date;

public record RegisterUserRequest(
        String name,
        String surname,
        String email,
        String password,
        String TCNumber,
        String phoneNumber,
        String gender,
        String bloodType,
        Date birthDate,
        boolean hasUserAppliedKVKK
) {

}
