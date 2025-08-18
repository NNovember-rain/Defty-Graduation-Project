package com.defty.content_service.client;

import com.example.common_library.configuration.AuthenticationRequestInterceptor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "class-management-service",
        configuration = {AuthenticationRequestInterceptor.class})
public interface ClassServiceClient {
    @GetMapping("/class-management-service/class/{classId}")
    void getClassById(@PathVariable("classId") Long classId);
}
