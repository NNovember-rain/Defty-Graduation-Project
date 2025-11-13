package com.defty.class_management_service.utils;

import com.defty.class_management_service.repository.IClassRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InviteCodeUtil {

    @Autowired
    private final IClassRepository classRepository;
    public String generateUniqueInviteCode() {
        String inviteCode;
        do {
            inviteCode = RandomStringUtils.randomAlphanumeric(8).toUpperCase();
        } while (classRepository.existsByInviteCode(inviteCode));
        return inviteCode;
    }
}
