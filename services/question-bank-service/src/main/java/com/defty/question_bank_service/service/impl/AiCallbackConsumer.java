package com.defty.question_bank_service.service.impl;

import com.defty.question_bank_service.dto.internal.AICallbackMessage;
import com.defty.question_bank_service.dto.internal.AICallbackRequest;
import com.defty.question_bank_service.dto.internal.TestSetData;
import com.defty.question_bank_service.service.IAICallbackService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiCallbackConsumer {

    private final IAICallbackService aiCallbackService;

    @KafkaListener(topics = "${app.kafka-topic-test-set-completed}", groupId = "question-bank-service")
    public void handleAiCallback(@Payload String messageJson) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            AICallbackMessage message = objectMapper.readValue(messageJson, AICallbackMessage.class);

            log.info("Received AI callback - uploadId: {}, filePath: {}",
                    message.getUploadId(), message.getFileStoragePath());

            // Access nested data
            TestSetData testSetData = message.getData();
            if(testSetData != null){
                log.info("Test name: {}", testSetData.getTestSet().getTestName());
                log.info("Number of question groups: {}", testSetData.getTestQuestionGroups().size());
            }
//             Process the data
            aiCallbackService.processAICallback(message);

        } catch (Exception e) {
            log.error("Error processing AI callback");
        }
    }
}

