package com.ky.huaweiproject.request;

import lombok.Builder;

@Builder
public record ChangePasswordRequest(
        String currentPassword,
        String newPassword,
        String confirmNewPassword
) {
}
