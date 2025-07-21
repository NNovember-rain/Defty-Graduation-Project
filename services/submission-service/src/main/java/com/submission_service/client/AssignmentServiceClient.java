package com.submission_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

//@FeignClient(name = "identity-service",
//        configuration = {AuthenticationRequestInterceptor.class})
public interface AssignmentServiceClient {
    @GetMapping("/assignment/{assignmentId}")
    void getAssignment(@PathVariable("assignmentId") Long assignmentId);
}
