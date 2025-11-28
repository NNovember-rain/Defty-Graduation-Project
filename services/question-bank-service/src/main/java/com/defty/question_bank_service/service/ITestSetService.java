package com.defty.question_bank_service.service;

import com.defty.question_bank_service.dto.response.PageableResponse;
import com.defty.question_bank_service.dto.request.QuestionGroupOrderRequest;
import com.defty.question_bank_service.dto.request.TestSetRequest;
import com.defty.question_bank_service.dto.response.QuestionGroupResponse;
import com.defty.question_bank_service.dto.response.TestSetDetailResponse;
import com.defty.question_bank_service.dto.response.TestSetQuestionOrderResponse;
import com.defty.question_bank_service.dto.response.TestSetResponse;
import com.defty.question_bank_service.dto.response.client.TestSetOverviewResponse;
import com.defty.question_bank_service.dto.response.client.TestSetQuestionsResponse;
import com.defty.question_bank_service.enums.ToeicPart;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ITestSetService {
    UUID createTestSet(TestSetRequest request);

    TestSetResponse getTestSetById(UUID id);

    PageableResponse<TestSetResponse> getTestSets(
            Pageable pageable,
            String testName,
            String slug,
            UUID collectionId,
            Integer status
    );

    UUID updateTestSet(UUID id, TestSetRequest request);

    List<UUID> deleteTestSets(List<UUID> ids);

    UUID toggleActiveStatus(UUID id);

    List<TestSetResponse> getAllActiveSets();

    List<TestSetResponse> getTestSetsByCollection(UUID collectionId);

    List<UUID> addQuestionGroups(UUID testSetId, List<QuestionGroupOrderRequest> requests);

    List<UUID> updateQuestionGroupOrders(UUID testSetId, List<QuestionGroupOrderRequest> requests);

    Page<QuestionGroupResponse> getQuestionGroupsByTestSet(
            UUID testSetId,
            List<UUID> tagIds,
            String questionPart,
            String difficulty,
            int page,
            int limit
    );

    void removeQuestionGroups(UUID testSetId, List<UUID> questionGroupIds);
    TestSetDetailResponse getTestSetDetail(UUID id, List<ToeicPart> parts);
    TestSetOverviewResponse getTestSetOverview(String slug);
    TestSetQuestionsResponse getTestSetQuestions(String slug, List<ToeicPart> parts);
    List<TestSetQuestionOrderResponse> getQuestionGroupOrders(UUID testSetId);

    UUID togglePublicStatus(UUID id);
    PageableResponse<TestSetResponse> getPublicTestSets(Pageable pageable, String testName, UUID collectionId);
}