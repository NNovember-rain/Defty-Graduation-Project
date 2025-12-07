//package com.defty.question_bank_service.client_service;
//import com.defty.common_library.dto.response.ApiResponse;
//import com.defty.common_library.security.AuthenticationRequestInterceptor;
//import org.springframework.cloud.openfeign.FeignClient;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//import java.util.Map;
//import java.util.UUID;
//
//@FeignClient(
//        name = "test-evaluation-client",
//        url = "${app.test-evaluation-service-url}",
//        configuration = {AuthenticationRequestInterceptor.class}
//)
//public interface TestEvaluationClient {
//
//    @PostMapping("/test-evaluation-service/test-history/check/batch")
//    ApiResponse<Map<UUID, Boolean>> hasUserTakenTestBatch(
//            @RequestParam("userId") Long userId,
//            @RequestBody List<UUID> testsetIds
//    );
//}
//
//
//
