package com.defty.question_bank_service.service.impl;
//import com.defty.common_library.file.ServerFileService;
import com.defty.question_bank_service.dto.internal.*;
import com.defty.question_bank_service.entity.*;
import com.defty.question_bank_service.enums.QuestionSource;
import com.defty.question_bank_service.enums.Status;
import com.defty.question_bank_service.repository.*;
import com.defty.question_bank_service.service.IAICallbackService;
import com.example.common_library.exceptions.AppException;
import com.example.common_library.exceptions.ErrorCode;
import com.example.common_library.exceptions.NotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AICallbackService implements IAICallbackService {

    // File Processing Status Constants
    private static final int STATUS_COMPLETED = 1;
    private static final int STATUS_PROCESSING = 2;
    private static final int STATUS_FAILED = 4;

    private final ITestSetRepository testSetRepository;
    private final IQuestionGroupRepository questionGroupRepository;
    private final IQuestionRepository questionRepository;
    private final IAnswerRepository answerRepository;
    private final ITestQuestionGroupRepository testQuestionGroupRepository;
    private final IFileProcessingRepository fileProcessingRepository;
    private final ObjectMapper objectMapper;
//    private final ServerFileService serverFileService;

    @Override
    @Transactional
    public void processAICallback(AICallbackMessage message) {
        UUID uploadId = null;

        try {
            log.info("Starting to process AI callback for uploadId: {}", message.getUploadId());
//            serverFileService.deleteFile(message.getFileStoragePath());
            // Parse and validate uploadId
            uploadId = parseUploadId(message.getUploadId());
            final UUID finalUploadId = uploadId;

            // Get FileProcessing record
            FileProcessingEntity fileProcessing = fileProcessingRepository.findById(uploadId)
                    .orElseThrow(() -> new NotFoundException(
                            "Không tìm thấy bản ghi xử lý với ID: " + finalUploadId));

            // Set to PROCESSING status
            fileProcessing.setStatus(STATUS_PROCESSING);
            fileProcessingRepository.save(fileProcessing);

            // Handle different status
            if ("failed".equalsIgnoreCase(message.getStatus())) {
                handleFailedCallback(fileProcessing, message);
                return;
            }

            if (!"success".equalsIgnoreCase(message.getStatus())) {
                throw new AppException(ErrorCode.BAD_REQUEST,
                        "Invalid AI callback status: " + message.getStatus());
            }

            // Validate data exists
            if (message.getData() == null || message.getData().getTestQuestionGroups() == null) {
                throw new AppException(ErrorCode.BAD_REQUEST,
                        "AI callback data is null or empty");
            }

            // Process success callback with partial success handling
            handleSuccessCallback(fileProcessing, message.getData());

            log.info("Completed processing AI callback for uploadId: {}", uploadId);

        } catch (Exception e) {
            log.error("Error processing AI callback for uploadId: {}", message.getUploadId(), e);

            // Try to update FileProcessing status if possible
            if (uploadId != null) {
                updateFileProcessingOnError(uploadId, e.getMessage());
            }

            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Failed to process AI callback: " + e.getMessage());
        }
    }

    /**
     * Handle failed AI callback
     */
    private void handleFailedCallback(FileProcessingEntity fileProcessing, AICallbackMessage message) {
        log.warn("AI processing failed for uploadId: {}, error: {}, reason: {}",
                message.getUploadId(), message.getError(), message.getReason());

        fileProcessing.setStatus(STATUS_FAILED);
        fileProcessing.setErrorMessage(
                String.format("AI Processing Error: %s | Reason: %s",
                        message.getError(), message.getReason())
        );
        fileProcessing.setCompletedAt(LocalDateTime.now());
        fileProcessing.setTotalQuestionsFound(0);
        fileProcessing.setQuestionsInserted(0);
        fileProcessing.setQuestionsFailed(0);

        fileProcessingRepository.save(fileProcessing);
    }

    /**
     * Handle success AI callback with partial success support
     */
    private void handleSuccessCallback(FileProcessingEntity fileProcessing, TestSetData data) {
        // Validate TestSet exists
        TestSetEntity testSet = fileProcessing.getTestSet();
        if (testSet == null) {
            throw new NotFoundException("TestSet not found in FileProcessing record");
        }

        // Statistics tracking
        ProcessingStats stats = new ProcessingStats();
        Map<String, List<QuestionError>> errorsByGroup = new LinkedHashMap<>();

        // Calculate cumulative question numbers for notes
        int cumulativeQuestionNumber = 1;

        // Process each question group
        for (TestQuestionGroupWrapper wrapper : data.getTestQuestionGroups()) {
            try {
                int questionsInGroup = wrapper.getQuestionGroup().getQuestions() != null
                        ? wrapper.getQuestionGroup().getQuestions().size()
                        : 0;

                processQuestionGroupWithErrorTracking(
                        testSet,
                        wrapper,
                        stats,
                        errorsByGroup,
                        cumulativeQuestionNumber
                );

                // Update cumulative counter
                cumulativeQuestionNumber += questionsInGroup;

            } catch (Exception e) {
                log.error("Failed to process question group order {}: {}",
                        wrapper.getQuestionGroupOrder(), e.getMessage());

                String groupKey = "Group_" + wrapper.getQuestionGroupOrder();
                errorsByGroup.computeIfAbsent(groupKey, k -> new ArrayList<>())
                        .add(new QuestionError(
                                null,
                                "GROUP_ERROR",
                                "Không thể xử lý group: " + e.getMessage()
                        ));

                // Still update cumulative counter even if failed
                if (wrapper.getQuestionGroup().getQuestions() != null) {
                    cumulativeQuestionNumber += wrapper.getQuestionGroup().getQuestions().size();
                }
            }
        }

        // Update FileProcessing with results
        updateFileProcessingResults(fileProcessing, stats, errorsByGroup);

        log.info("Processing completed. Inserted: {}, Failed: {}, Total: {}",
                stats.questionsInserted,
                stats.questionsFailed,
                stats.totalQuestions);
    }

    /**
     * Process a question group and track errors
     */
    private void processQuestionGroupWithErrorTracking(
            TestSetEntity testSet,
            TestQuestionGroupWrapper wrapper,
            ProcessingStats stats,
            Map<String, List<QuestionError>> errorsByGroup,
            int startQuestionNumber) {

        QuestionGroup qgData = wrapper.getQuestionGroup();
        String groupKey = "Group_" + wrapper.getQuestionGroupOrder() +
                " (" + qgData.getQuestionPart() + ")";

        // Validate group data
        if (qgData.getQuestions() == null || qgData.getQuestions().isEmpty()) {
            log.warn("Question group {} has no questions", wrapper.getQuestionGroupOrder());
            return;
        }

        // Calculate question number range for notes
        int questionCount = qgData.getQuestions().size();
        int firstQuestion = startQuestionNumber;
        int lastQuestion = startQuestionNumber + questionCount - 1;
        int questionGroupOrder = Optional.ofNullable(wrapper)
                .map(TestQuestionGroupWrapper::getQuestionGroupOrder)
                .orElse(0);

        // Create QuestionGroup entity
        QuestionGroupEntity questionGroup = null;
        try {
            questionGroup = createQuestionGroup(qgData, testSet.getTestName(), firstQuestion, lastQuestion, questionGroupOrder);
            questionGroup = questionGroupRepository.save(questionGroup);

            // Create TestQuestionGroup mapping
            TestQuestionGroupEntity mapping = new TestQuestionGroupEntity();
            mapping.setTestSet(testSet);
            mapping.setQuestionGroup(questionGroup);
            mapping.setQuestionPartOrder(wrapper.getQuestionGroupOrder());
            testQuestionGroupRepository.save(mapping);

            log.info("Created question group: {} with notes: {}",
                    questionGroup.getId(), questionGroup.getNotes());

        } catch (Exception e) {
            log.error("Failed to create question group for order {}: {}",
                    wrapper.getQuestionGroupOrder(), e.getMessage(), e);

            errorsByGroup.computeIfAbsent(groupKey, k -> new ArrayList<>())
                    .add(new QuestionError(
                            null,
                            "GROUP_CREATION_ERROR",
                            "Không thể tạo question group: " + e.getMessage()
                    ));

            // Count all questions in this group as failed
            if (qgData.getQuestions() != null) {
                stats.totalQuestions += qgData.getQuestions().size();
                stats.questionsFailed += qgData.getQuestions().size();
            }
            return; // Skip questions if group creation failed
        }

        // Process each question in the group
        for (Question qData : qgData.getQuestions()) {
            stats.totalQuestions++;

            try {
                createQuestionWithAnswers(questionGroup, qData);
                stats.questionsInserted++;

                log.debug("Successfully created question {} with {} answers",
                        qData.getQuestionNumber(),
                        qData.getAnswers() != null ? qData.getAnswers().size() : 0);

            } catch (Exception e) {
                stats.questionsFailed++;

                errorsByGroup.computeIfAbsent(groupKey, k -> new ArrayList<>())
                        .add(new QuestionError(
                                qData.getQuestionNumber(),
                                determineErrorType(e),
                                e.getMessage()
                        ));

                log.error("Failed to create question {} in group {}: {}",
                        qData.getQuestionNumber(),
                        wrapper.getQuestionGroupOrder(),
                        e.getMessage(), e);
            }
        }
    }

    /**
     * Create a single question with its answers
     */
    private void createQuestionWithAnswers(QuestionGroupEntity group, Question qData) {
        // Validate question data
        validateQuestion(qData);

        // Create Question
        QuestionEntity question = new QuestionEntity();
        question.setQuestionNumber(qData.getQuestionNumber());
        question.setQuestionText(qData.getQuestionText() != null ? qData.getQuestionText() : "");
        question.setDifficulty(null);
        question.setStatus(Status.ACTIVE.getCode());
        question.setQuestionGroup(group);

        QuestionEntity savedQuestion = questionRepository.save(question);

        // Create Answers - IMPORTANT: Must validate answers list exists
        if (qData.getAnswers() == null || qData.getAnswers().isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Câu hỏi số " + qData.getQuestionNumber() + " không có đáp án");
        }

        List<AnswerEntity> answers = new ArrayList<>();
        for (Answer aData : qData.getAnswers()) {
            AnswerEntity answer = new AnswerEntity();
            answer.setContent(aData.getContent() != null ? aData.getContent() : "");
            answer.setAnswerOrder(aData.getOrder());
            answer.setIsCorrect(aData.getIsCorrect() != null ? aData.getIsCorrect() : false);
            answer.setStatus(Status.ACTIVE.getCode());
            answer.setQuestion(savedQuestion);
            answers.add(answer);
        }

        answerRepository.saveAll(answers);

        log.debug("Saved {} answers for question {}", answers.size(), qData.getQuestionNumber());
    }

    /**
     * Validate Question data
     */
    private void validateQuestion(Question qData) {
        if (qData.getQuestionNumber() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Question number is required");
        }

        if (qData.getAnswers() == null || qData.getAnswers().isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Câu hỏi số " + qData.getQuestionNumber() + " phải có đáp án");
        }

        // Validate exactly one correct answer
        long correctCount = qData.getAnswers().stream()
                .filter(a -> a.getIsCorrect() != null && a.getIsCorrect())
                .count();

        if (correctCount != 1) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    String.format("Câu hỏi số %d phải có đúng 1 đáp án đúng (hiện có %d đáp án đúng)",
                            qData.getQuestionNumber(), correctCount));
        }

        // Validate no duplicate answer orders
        Set<Integer> orders = new HashSet<>();
        for (Answer a : qData.getAnswers()) {
            if (a.getOrder() == null) {
                throw new AppException(ErrorCode.BAD_REQUEST,
                        String.format("Câu hỏi số %d có đáp án thiếu thứ tự",
                                qData.getQuestionNumber()));
            }
            if (!orders.add(a.getOrder())) {
                throw new AppException(ErrorCode.BAD_REQUEST,
                        String.format("Câu hỏi số %d có thứ tự đáp án bị trùng: %d",
                                qData.getQuestionNumber(), a.getOrder()));
            }
        }

        // Validate answer count (usually 4 for TOEIC)
        if (qData.getAnswers().size() != 4) {
            log.warn("Question {} has {} answers (expected 4)",
                    qData.getQuestionNumber(), qData.getAnswers().size());
        }
    }

    /**
     * Create QuestionGroup entity with notes
     * Format: "Nguồn: Câu 150-152 đề ETS 2019"
     */
    private QuestionGroupEntity createQuestionGroup(
            QuestionGroup qgData,
            String testSetName,
            int firstQuestion,
            int lastQuestion,
            int questionGroupOrder) {

        QuestionGroupEntity questionGroup = new QuestionGroupEntity();
        questionGroup.setQuestionPart(qgData.getQuestionPart());
        questionGroup.setAudioTranscript(qgData.getAudioTranscript());
        questionGroup.setSource(QuestionSource.PDF_UPLOAD);
        questionGroup.setStatus(Status.ACTIVE.getCode());
        questionGroup.setQuestionGroupOrder(questionGroupOrder);

        // Build notes: "Nguồn: Câu {first}-{last} đề {testSetName}"
        String notes;
        if (firstQuestion == lastQuestion) {
            notes = String.format("Nguồn: Câu %d đề %s", firstQuestion, testSetName);
        } else {
            notes = String.format("Nguồn: Câu %d-%d đề %s", firstQuestion, lastQuestion, testSetName);
        }
        questionGroup.setNotes(notes);

        return questionGroup;
    }

    /**
     * Update FileProcessing with processing results
     */
    private void updateFileProcessingResults(
            FileProcessingEntity fileProcessing,
            ProcessingStats stats,
            Map<String, List<QuestionError>> errorsByGroup) {

        fileProcessing.setTotalQuestionsFound(stats.totalQuestions);
        fileProcessing.setQuestionsInserted(stats.questionsInserted);
        fileProcessing.setQuestionsFailed(stats.questionsFailed);
        fileProcessing.setCompletedAt(LocalDateTime.now());

        // Set status based on results
        if (stats.questionsFailed > 0) {
            // Partial success - still mark as COMPLETED but with error details
            fileProcessing.setStatus(STATUS_COMPLETED);

            StringBuilder errorMsg = new StringBuilder();
            errorMsg.append(String.format("Xử lý hoàn tất với %d lỗi. ", stats.questionsFailed));
            errorMsg.append(String.format("Đã thêm thành công %d/%d câu hỏi.",
                    stats.questionsInserted, stats.totalQuestions));

            fileProcessing.setErrorMessage(errorMsg.toString());

            // Convert errors to JSON
            try {
                String issueDetails = objectMapper.writeValueAsString(errorsByGroup);
                fileProcessing.setIssueDetails(issueDetails);
            } catch (Exception e) {
                log.error("Failed to serialize issue details", e);
                fileProcessing.setIssueDetails("{\"error\": \"Failed to serialize error details\"}");
            }
        } else {
            // Complete success
            fileProcessing.setStatus(STATUS_COMPLETED);
            fileProcessing.setErrorMessage(null);
            fileProcessing.setIssueDetails(null);
        }

        fileProcessingRepository.save(fileProcessing);

        log.info("Updated FileProcessing: status={}, inserted={}, failed={}",
                fileProcessing.getStatus(),
                stats.questionsInserted,
                stats.questionsFailed);
    }

    /**
     * Determine error type from exception
     */
    private String determineErrorType(Exception e) {
        String message = e.getMessage().toLowerCase();

        if (message.contains("đáp án")) {
            return "ANSWER_ERROR";
        } else if (message.contains("thứ tự")) {
            return "ORDER_ERROR";
        } else if (message.contains("required") || message.contains("null")) {
            return "VALIDATION_ERROR";
        } else if (message.contains("duplicate")) {
            return "DUPLICATE_ERROR";
        } else {
            return "UNKNOWN_ERROR";
        }
    }

    /**
     * Parse uploadId from string
     */
    private UUID parseUploadId(String uploadIdString) {
        try {
            return UUID.fromString(uploadIdString);
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Invalid uploadId format: " + uploadIdString);
        }
    }

    /**
     * Update FileProcessing status on error
     */
    private void updateFileProcessingOnError(UUID uploadId, String errorMessage) {
        try {
            fileProcessingRepository.findById(uploadId).ifPresent(fp -> {
                fp.setStatus(STATUS_FAILED);
                fp.setErrorMessage("Lỗi xử lý: " + errorMessage);
                fp.setCompletedAt(LocalDateTime.now());
                fp.setTotalQuestionsFound(0);
                fp.setQuestionsInserted(0);
                fp.setQuestionsFailed(0);
                fileProcessingRepository.save(fp);
            });
        } catch (Exception e) {
            log.error("Failed to update FileProcessing status on error", e);
        }
    }

    // ========== INNER CLASSES ==========

    /**
     * Statistics tracking
     */
    private static class ProcessingStats {
        int totalQuestions = 0;
        int questionsInserted = 0;
        int questionsFailed = 0;
    }

    /**
     * Question error details
     */
    private static class QuestionError {
        private Integer questionNumber;
        private String errorType;
        private String errorMessage;

        public QuestionError(Integer questionNumber, String errorType, String errorMessage) {
            this.questionNumber = questionNumber;
            this.errorType = errorType;
            this.errorMessage = errorMessage;
        }

        public Integer getQuestionNumber() {
            return questionNumber;
        }

        public String getErrorType() {
            return errorType;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }
}