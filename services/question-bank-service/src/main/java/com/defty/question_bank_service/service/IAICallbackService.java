package com.defty.question_bank_service.service;

import com.defty.question_bank_service.dto.internal.AICallbackMessage;
import com.defty.question_bank_service.dto.internal.AICallbackRequest;

import java.util.UUID;

public interface IAICallbackService {

    void processAICallback(AICallbackMessage message);
}