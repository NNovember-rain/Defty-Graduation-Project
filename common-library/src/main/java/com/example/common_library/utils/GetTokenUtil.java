package com.example.common_library.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
public class GetTokenUtil {
    public static String getToken() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        assert attributes != null;
        String token = attributes.getRequest().getHeader("Authorization");
        log.info("Token: {}", token);
        return token;
    }
}
