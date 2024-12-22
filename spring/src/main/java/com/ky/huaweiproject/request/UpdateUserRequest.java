package com.ky.huaweiproject.request;


import java.util.Date;

public record UpdateUserRequest(
        String name,
        String surname,
        String TCNumber,
        String phoneNumber,
        String bloodType,
        Date birthDate,
        Double height,
        Double weight
) {
}
