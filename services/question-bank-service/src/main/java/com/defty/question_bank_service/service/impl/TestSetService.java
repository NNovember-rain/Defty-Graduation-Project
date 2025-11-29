package com.defty.question_bank_service.service.impl;


import com.example.common_library.exceptions.AppException;
import com.example.common_library.exceptions.ErrorCode;
import com.example.common_library.exceptions.ForbiddenException;
//import com.example.common_library.security.AuthUserContext;
//import com.example.common_library.utils.FileUrlUtil;
//import com.defty.question_bank_service.client_service.TestEvaluationClient;
import com.defty.question_bank_service.dto.request.DirectionContentDTO;
import com.defty.question_bank_service.dto.request.QuestionGroupOrderRequest;
import com.defty.question_bank_service.dto.request.TestSetRequest;
import com.defty.question_bank_service.dto.response.*;
import com.defty.question_bank_service.dto.response.client.*;
import com.defty.question_bank_service.dto.response.projection.TestSetStatsProjection;
import com.defty.question_bank_service.dto.response.projection.TestSetSummary;
import com.defty.question_bank_service.entity.*;
import com.defty.question_bank_service.enums.Status;
import com.defty.question_bank_service.enums.ToeicPart;
import com.defty.question_bank_service.mapper.QuestionGroupMapper;
import com.defty.question_bank_service.mapper.TestSetMapper;
import com.defty.question_bank_service.repository.*;
import com.defty.question_bank_service.service.ITestSetService;
import com.example.common_library.exceptions.NotFoundException;
import com.defty.question_bank_service.utils.SlugUtils;
import com.defty.question_bank_service.validation.TestSetValidation;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TestSetService implements ITestSetService {
    private final ITestSetRepository testSetRepository;
    private final TestSetMapper testSetMapper;
    private final TestSetValidation testSetValidation;
    private final ITestCollectionRepository testCollectionRepository;
    private final SlugUtils slugUtils;
    private final ITestQuestionGroupRepository testQuestionGroupRepository;
    private final IQuestionGroupRepository questionGroupRepository;
    private final QuestionGroupMapper mapper;
//    private final AuthUserContext authUserContext;
//    private final TestEvaluationClient testEvaluationClient;
//    private final FileUrlUtil fileUrlUtil;

    @Override
    @Transactional
    public UUID createTestSet(TestSetRequest request) {
        log.info("Request received to create test set: {}", request.getTestName());
        testSetValidation.fieldValidation(request, null);

        TestSetEntity entity = testSetMapper.toTestSetEntity(request);

        // TestCollection Handler
        if (request.getCollectionId() != null) {
            TestCollectionEntity collection = testCollectionRepository
                    .findByIdAndStatusNot(request.getCollectionId(), -1)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Collection with ID " + request.getCollectionId() + " not found or inactive"));

            entity.setCollection(collection);
        }

        // Slug Handler
        String slug = slugUtils.toSlug(request.getTestName());
        String uniqueSlug = slug;
        int counter = 1;
        while (true) {
            boolean exists = testSetRepository.existsBySlug(uniqueSlug);
            if (!exists) {
                break;
            }
            uniqueSlug = slug + "-" + counter;
            counter++;
        }
        entity.setSlug(uniqueSlug);

        entity = testSetRepository.save(entity);

        log.info("Test set '{}' saved successfully with ID: {}", entity.getTestName(), entity.getId());
        return entity.getId();
    }

    @Override
    public TestSetResponse getTestSetById(UUID id) {
        TestSetEntity entity = testSetRepository.findByIdAndStatusNotWithCollection(id, -1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài test với ID: " + id));

        return testSetMapper.toTestSetResponse(entity);
    }

    @Override
    public PageableResponse<TestSetResponse> getTestSets(Pageable pageable, String testName, String slug, UUID collectionId, Integer status) {

        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by("createdDate").descending()
        );

        Page<TestSetSummary> summaries = testSetRepository.findTestSetSummaries(
                testName == null ? "" : testName.trim(),
                slug == null ? "" : slug.trim(),
                collectionId,
                status,
                sortedPageable
        );

        List<UUID> testsetIds = summaries.stream().map(TestSetSummary::getId).toList();

        Map<UUID, Boolean> takenMap = getTakenMapForUser(testsetIds);

        List<TestSetStatsProjection> stats = testSetRepository.findStatsByTestSetIds(testsetIds);

        Map<UUID, Long> attemptMap = new HashMap<>();
        Map<UUID, Long> commentMap = new HashMap<>();

        for (TestSetStatsProjection s : stats) {
            attemptMap.put(s.getTestSetId(), s.getAttemptCount());
            commentMap.put(s.getTestSetId(), s.getCommentCount());
        }

        List<TestSetResponse> responses = summaries.stream()
                .map(s -> TestSetResponse.builder()
                        .id(s.getId())
                        .testName(s.getTestName())
                        .slug(s.getSlug())
                        .testNumber(s.getTestNumber())
                        .description(s.getDescription())
                        .collectionId(s.getCollectionId())
                        .collectionName(s.getCollectionName())
                        .status(s.getStatus())
                        .isPublic(s.getIsPublic())
                        .createdDate(s.getCreatedDate())
                        .modifiedDate(s.getModifiedDate())
                        .createdBy(s.getCreatedBy())
                        .modifiedBy(s.getModifiedBy())
                        .totalQuestions(s.getTotalQuestions() == null ? 0 : s.getTotalQuestions().intValue())
                        .isTaken(takenMap.getOrDefault(s.getId(), false))
                        .attemptCount(attemptMap.getOrDefault(s.getId(), 0L))
                        .commentCount(commentMap.getOrDefault(s.getId(), 0L))
                        .build()
                ).toList();

        return new PageableResponse<>(responses, summaries.getTotalElements());
    }




//    @Override
//    public PageableResponse<TestSetResponse> getTestSets(
//            Pageable pageable, String testName, String slug, UUID collectionId, Integer status) {
//
//        Pageable sortedPageable = PageRequest.of(
//                pageable.getPageNumber(),
//                pageable.getPageSize(),
//                Sort.by("createdDate").descending()
//        );
//
//        String testNameParam = (testName == null) ? "" : testName;
//        String slugParam = (slug == null) ? "" : slug;
//
//        Page<TestSetEntity> entities = testSetRepository.findTestSets(
//                testNameParam, slugParam, collectionId, status, sortedPageable);
//
//        List<TestSetResponse> responses = entities.getContent().stream()
//                .map(testSetMapper::toTestSetResponse)
//                .collect(Collectors.toList());
//
//        return new PageableResponse<>(responses, entities.getTotalElements());
//    }

    @Override
    public List<TestSetResponse> getAllActiveSets() {
        Page<TestSetSummary> summaries = testSetRepository.findTestSetSummaries(
                "",
                "",
                null,
                1,
                PageRequest.of(0, Integer.MAX_VALUE)
        );

        List<TestSetResponse> responses = summaries.stream()
                .map(s -> TestSetResponse.builder()
                        .id(s.getId())
                        .testName(s.getTestName())
                        .slug(s.getSlug())
                        .testNumber(s.getTestNumber())
                        .description(s.getDescription())
                        .collectionId(s.getCollectionId())
                        .collectionName(s.getCollectionName())
                        .status(s.getStatus())
                        .createdDate(s.getCreatedDate())
                        .modifiedDate(s.getModifiedDate())
                        .createdBy(s.getCreatedBy())
                        .modifiedBy(s.getModifiedBy())
                        .totalQuestions(s.getTotalQuestions() != null ? s.getTotalQuestions().intValue() : 0)
                        .build())
                .toList();
        return responses;
//        List<TestSetEntity> entities = testSetRepository.findByStatusOrderByTestNameAscWithCollection(1);
//        return entities.stream()
//                .map(testSetMapper::toTestSetResponse)
//                .collect(Collectors.toList());
    }

    @Override
    public List<TestSetResponse> getTestSetsByCollection(UUID collectionId) {
        List<TestSetEntity> entities = testSetRepository.findByCollectionIdAndStatusOrderByTestNumberAscWithCollection(collectionId, 1);
        return entities.stream()
                .map(testSetMapper::toTestSetResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UUID updateTestSet(UUID id, TestSetRequest request) {
        TestSetEntity entity = testSetRepository.findByIdAndStatus(id, 1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài test với ID: " + id));

        testSetValidation.fieldValidation(request, id);

        // Slug Handler
        String slug = slugUtils.toSlug(request.getTestName());
        String uniqueSlug = slug;
        int counter = 1;
        while (true) {
            boolean exists = testSetRepository.existsBySlugAndIdNot(uniqueSlug, id);
            if (!exists) {
                break;
            }
            uniqueSlug = slug + "-" + counter;
            counter++;
        }
        entity.setSlug(uniqueSlug);

        testSetMapper.updateTestSetFromRequest(request, entity);

        // Collection Handler
        if (request.getCollectionId() != null) {
            TestCollectionEntity collection = testCollectionRepository
                    .findByIdAndStatusNot(request.getCollectionId(), -1)
                    .orElseThrow(() -> new NotFoundException(
                            "Không tìm thấy bộ sưu tập với ID: " + request.getCollectionId()));
            entity.setCollection(collection);
        }

        entity = testSetRepository.save(entity);

        return entity.getId();
    }


    @Override
    @Transactional
    public List<UUID> deleteTestSets(List<UUID> ids) {
        List<TestSetEntity> entities = testSetRepository.findAllByIdInAndStatusNot(ids, -1);

        if (entities.isEmpty()) {
            throw new NotFoundException("Không tìm thấy bài test nào để xóa");
        }

        entities.forEach(entity -> entity.setStatus(-1));
        testSetRepository.saveAll(entities);

        return entities.stream()
                .map(TestSetEntity::getId)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UUID toggleActiveStatus(UUID id) {
        TestSetEntity entity = testSetRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài test với ID: " + id));

        Integer currentStatus = entity.getStatus();
        if (currentStatus != null) {
            if (currentStatus == 1) {
                entity.setStatus(0);
                testSetRepository.save(entity);
            } else if (currentStatus == 0) {
                entity.setStatus(1);
                testSetRepository.save(entity);
            }
        }

        return entity.getId();
    }

    @Override
    @Transactional
    public List<UUID> addQuestionGroups(UUID testSetId, List<QuestionGroupOrderRequest> requests) {
        TestSetEntity testSet = testSetRepository.findById(testSetId)
                .orElseThrow(() -> new NotFoundException("Test set not found, Id: " + testSetId));

        List<UUID> questionGroupIds = requests.stream()
                .map(QuestionGroupOrderRequest::getQuestionGroupId)
                .toList();

        List<QuestionGroupEntity> questionGroups = questionGroupRepository.findAllById(questionGroupIds);

        if (questionGroups.size() != questionGroupIds.size()) {
            throw new NotFoundException("One or more question groups not found, Ids: " + questionGroupIds);
        }

        List<UUID> existingIds = testQuestionGroupRepository.findByTestSetId(testSetId)
                .stream()
                .map(tqg -> tqg.getQuestionGroup().getId())
                .toList();

        Map<UUID, Integer> orderMap = requests.stream()
                .collect(Collectors.toMap(QuestionGroupOrderRequest::getQuestionGroupId, QuestionGroupOrderRequest::getQuestionPartOrder));

        List<TestQuestionGroupEntity> newEntities = questionGroups.stream()
                .filter(qg -> !existingIds.contains(qg.getId()))
                .map(qg -> TestQuestionGroupEntity.builder()
                        .testSet(testSet)
                        .questionGroup(qg)
                        .questionPartOrder(orderMap.get(qg.getId()))
                        .build())
                .toList();

        if (newEntities.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "All question groups already exist in this test set");
        }

        List<TestQuestionGroupEntity> savedEntities = testQuestionGroupRepository.saveAll(newEntities);

        return savedEntities.stream()
                .map(TestQuestionGroupEntity::getId)
                .toList();
    }

    @Override
    @Transactional
    public List<UUID> updateQuestionGroupOrders(UUID testSetId, List<QuestionGroupOrderRequest> requests) {
        TestSetEntity testSet = testSetRepository.findById(testSetId)
                .orElseThrow(() -> new NotFoundException("Test set not found, Id: " + testSetId));

        if (requests == null || requests.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Request list cannot be empty");
        }

        Map<UUID, Integer> orderMap = requests.stream()
                .collect(Collectors.toMap(
                        QuestionGroupOrderRequest::getQuestionGroupId,
                        QuestionGroupOrderRequest::getQuestionPartOrder
                ));

        List<TestQuestionGroupEntity> existingRelations = testQuestionGroupRepository.findByTestSetId(testSetId);

        List<TestQuestionGroupEntity> updatedEntities = existingRelations.stream()
                .filter(rel -> orderMap.containsKey(rel.getQuestionGroup().getId()))
                .peek(rel -> rel.setQuestionPartOrder(orderMap.get(rel.getQuestionGroup().getId())))
                .toList();

        if (updatedEntities.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "No matching question groups found in this test set to update order");
        }

        testQuestionGroupRepository.saveAll(updatedEntities);

        return updatedEntities.stream()
                .map(TestQuestionGroupEntity::getId)
                .toList();
    }

    @Override
    @Transactional
    public Page<QuestionGroupResponse> getQuestionGroupsByTestSet(UUID testSetId, List<UUID> tagIds, String questionPart, String difficulty, int page, int limit) {
        Sort sort = Sort.by(Sort.Direction.ASC, "createdDate");
        Pageable pageable = PageRequest.of(page, limit, sort);

        UUID[] tagIdsArray = (tagIds != null && !tagIds.isEmpty())
                ? tagIds.toArray(new UUID[0])
                : new UUID[0];
        boolean filterByTags = tagIds != null && !tagIds.isEmpty();


        Page<QuestionGroupEntity> pageResult = testQuestionGroupRepository.searchActiveByTestSetId(
                testSetId,
                questionPart,
                difficulty,
                filterByTags,
                tagIdsArray,
                pageable
        );

        if (pageResult.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        List<UUID> groupIds = pageResult.getContent().stream()
                .map(QuestionGroupEntity::getId)
                .toList();

        // Fetch gọn nhẹ (không cần file nếu muốn)
        List<QuestionGroupEntity> groups = testQuestionGroupRepository.findAllWithQuestionsByIds(groupIds);

        Map<UUID, QuestionGroupEntity> groupMap = groups.stream()
                .collect(Collectors.toMap(QuestionGroupEntity::getId, g -> g));

        List<QuestionGroupEntity> sortedGroups = groupIds.stream()
                .map(groupMap::get)
                .filter(Objects::nonNull)
                .toList();

        // Lọc deleted question/answer (nếu có)
        List<QuestionGroupResponse> responses = sortedGroups.stream()
                .peek(g -> {
                    g.getQuestions().removeIf(q -> !q.getStatus().equals(Status.ACTIVE.getCode()));
                    g.getQuestions().forEach(q ->
                            q.getAnswers().removeIf(a -> !a.getStatus().equals(Status.ACTIVE.getCode()))
                    );
                })
                .map(mapper::toResponse)
                .toList();

        return new PageImpl<>(responses, pageable, pageResult.getTotalElements());
    }

    @Transactional
    public void removeQuestionGroups(UUID testSetId, List<UUID> questionGroupIds) {
        if (!testSetRepository.existsById(testSetId)) {
            throw new AppException(ErrorCode.NOT_FOUND, "Test set not found");
        }

        if (questionGroupIds == null || questionGroupIds.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Question group IDs cannot be empty");
        }

        testQuestionGroupRepository.deleteByTestSetIdAndQuestionGroupIds(testSetId, questionGroupIds);
    }

    @Override
    @Transactional
    public TestSetDetailResponse getTestSetDetail(UUID id, List<ToeicPart> parts) {
        TestSetEntity testSet = testSetRepository.findByIdAndStatusNotWithCollection(id, -1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài test với ID: " + id));

        //GET TESTSET DETAIL WITH QUESTION PART ONLY

        //GET TESTSET QUESTION GROUP DETAIL

        List<QuestionGroupEntity> groups = new ArrayList<>(
                new LinkedHashSet<>(testQuestionGroupRepository.findFullDetailGroupsByTestSetIdAndParts(id, parts))
        );

        int totalQuestions = groups.stream()
                .mapToInt(g -> g.getQuestions().size())
                .sum();
        testSet.setTotalQuestions(totalQuestions);

        groups.forEach(group -> {
            if (group.getQuestions() != null) {
                group.getQuestions().removeIf(q -> !q.getStatus().equals(Status.ACTIVE.getCode()));
                group.getQuestions().forEach(q -> {
                    if (q.getAnswers() != null)
                        q.getAnswers().removeIf(a -> !a.getStatus().equals(Status.ACTIVE.getCode()));
                    if (q.getQuestionTagMappings() != null)
                        q.getQuestionTagMappings().removeIf(m ->
                                !m.getStatus().equals(Status.ACTIVE.getCode()) ||
                                        !m.getQuestionTag().getStatus().equals(Status.ACTIVE.getCode()));
                });
            }
            if (group.getFiles() != null)
                group.getFiles().removeIf(f -> !f.getStatus().equals(Status.ACTIVE.getCode()));
        });

        List<QuestionGroupResponse> groupResponses = groups.stream()
                .map(mapper::toResponse)
                .toList();

        TestSetResponse testSetResponse = testSetMapper.toTestSetResponse(testSet);

        // 5️⃣ Trả kết quả
        return TestSetDetailResponse.builder()
                .testSet(testSetResponse)
                .questionGroups(groupResponses)
                .build();
    }

    // ========== MÀN 1: OVERVIEW (CỰC NHANH - CHỈ COUNT) ==========
    @Override
    @Transactional
    public TestSetOverviewResponse getTestSetOverview(String slug) {

        Long currentUserId = null;
        try {
//            currentUserId = Long.valueOf(authUserContext.getUserId());
        } catch (Exception ignored) {}

        TestSetEntity testSet = testSetRepository.findBySlugAndStatusNot(slug, -1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài test với slug: " + slug));

        // Nếu private → yêu cầu login
        if (!testSet.isPublic() && currentUserId == null) {
            throw new ForbiddenException("Bài test này là private. Vui lòng đăng nhập để tiếp tục.");
        }

        // Lấy thống kê số câu hỏi theo part
        List<Object[]> counts = testQuestionGroupRepository.countQuestionsByPart(testSet.getId());
        Map<ToeicPart, Integer> partQuestionCount = counts.stream()
                .collect(Collectors.toMap(
                        row -> (ToeicPart) row[0],
                        row -> ((Long) row[1]).intValue()
                ));

        int totalQuestions = counts.stream()
                .mapToInt(row -> ((Long) row[1]).intValue())
                .sum();

        boolean isTaken = false;
        if (currentUserId != null) {
            Map<UUID, Boolean> takenMap = getTakenMapForUser(List.of(testSet.getId()));
            isTaken = takenMap.getOrDefault(testSet.getId(), false);
        }

        TestSetStatsEntity stats = testSet.getStats();
        Long attemptCount = (stats != null) ? stats.getAttemptCount() : 0L;
        Long commentCount = (stats != null) ? stats.getCommentCount() : 0L;

        return TestSetOverviewResponse.builder()
                .id(testSet.getId())
                .testName(testSet.getTestName())
                .slug(testSet.getSlug())
                .testNumber(testSet.getTestNumber())
                .description(testSet.getDescription())
                .collectionName(testSet.getCollection() != null ? testSet.getCollection().getCollectionName() : null)
                .totalQuestions(totalQuestions)
                .partQuestionCount(partQuestionCount)
                .isTaken(isTaken)
                .attemptCount(attemptCount)
                .commentCount(commentCount)
                .build();
    }



    // ========== MÀN 2: QUESTIONS (TỐI ƯU - QUERY TỪNG BƯỚC) ==========
    @Override
    @Transactional
    public TestSetQuestionsResponse getTestSetQuestions(String slug, List<ToeicPart> parts) {
        TestSetEntity testSetEntity = testSetRepository.findBySlugAndStatusNot(slug, -1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài test với slug: " + slug));

        UUID id = testSetEntity.getId();
        TestSetEntity testSet = testSetRepository.findByIdAndStatusNotWithCollection(id, -1)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài test với ID: " + id));

        List<QuestionGroupWithOrderDTO> groupsWithOrder =
                testQuestionGroupRepository.findGroupsWithPartOrderByTestSetAndParts(id, parts);

        if (groupsWithOrder.isEmpty()) {
            return TestSetQuestionsResponse.builder()
                    .testSetId(id)
                    .testSetSlug(testSet.getSlug())
                    .testName(testSet.getTestName())
                    .questionGroups(Collections.emptyList())
                    .directionSet(null) // vẫn trả key
                    .build();
        }

        List<UUID> groupIds = groupsWithOrder.stream().map(g -> g.getQuestionGroup().getId()).toList();
        List<QuestionEntity> allQuestions = testQuestionGroupRepository.findQuestionsByGroupIds(groupIds);
        List<UUID> questionIds = allQuestions.stream().map(QuestionEntity::getId).toList();
        List<AnswerEntity> allAnswers = testQuestionGroupRepository.findAnswersByQuestionIds(questionIds);
        List<FileEntity> allFiles = testQuestionGroupRepository.findFilesByGroupIds(groupIds);

        Map<UUID, List<AnswerEntity>> answersByQuestion = allAnswers.stream()
                .collect(Collectors.groupingBy(a -> a.getQuestion().getId()));

        Map<UUID, List<QuestionEntity>> questionsByGroup = allQuestions.stream()
                .collect(Collectors.groupingBy(q -> q.getQuestionGroup().getId()));

        Map<UUID, List<FileEntity>> filesByGroup = allFiles.stream()
                .collect(Collectors.groupingBy(f -> f.getQuestionGroup().getId()));

        List<QuestionGroupMinimalDTO> groupDTOs = groupsWithOrder.stream()
                .map(wrapper -> {
                    QuestionGroupEntity group = wrapper.getQuestionGroup();
                    return QuestionGroupMinimalDTO.builder()
                            .id(group.getId())
                            .questionPart(group.getQuestionPart())
                            .questionGroupOrder(wrapper.getQuestionPartOrder())
                            .passageText(group.getPassageText())
                            .files(mapToFileDTO(filesByGroup.getOrDefault(group.getId(), Collections.emptyList())))
                            .questions(mapToQuestionDTO(
                                    questionsByGroup.getOrDefault(group.getId(), Collections.emptyList()),
                                    answersByQuestion
                            ))
                            .build();
                })
                .toList();

        DirectionSetMinimalDTO directionSetDTO = null;

        return TestSetQuestionsResponse.builder()
                .testSetId(id)
                .testSetSlug(testSet.getSlug())
                .testName(testSet.getTestName())
                .questionGroups(groupDTOs)
                .directionSet(directionSetDTO)
                .build();
    }

    // ========== HELPER METHODS ==========
    private List<QuestionMinimalDTO> mapToQuestionDTO(
            List<QuestionEntity> questions,
            Map<UUID, List<AnswerEntity>> answersByQuestion
    ) {
        return questions.stream()
                .map(q -> QuestionMinimalDTO.builder()
                        .id(q.getId())
                        .questionNumber(q.getQuestionNumber())
                        .questionText(q.getQuestionText())
                        .answers(mapToAnswerDTO(answersByQuestion.getOrDefault(
                                q.getId(), Collections.emptyList()
                        )))
                        .build())
                .toList();
    }

    private List<AnswerMinimalDTO> mapToAnswerDTO(List<AnswerEntity> answers) {
        return answers.stream()
                .map(a -> AnswerMinimalDTO.builder()
                        .id(a.getId())
                        .content(a.getContent())
                        .answerOrder(a.getAnswerOrder())
                        // KHÔNG set isCorrect
                        .build())
                .toList();
    }

    private List<FileMinimalDTO> mapToFileDTO(List<FileEntity> files) {
        return files.stream()
                .map(f -> FileMinimalDTO.builder()
                        .id(f.getId())
//                        .url(fileUrlUtil.resolveFullUrl(f.getUrl()))
                        .fileType(f.getType())
                        .displayOrder(f.getDisplayOrder())
                        .build())
                .toList();
    }

    @Override
    public List<TestSetQuestionOrderResponse> getQuestionGroupOrders(UUID testSetId) {
        return testQuestionGroupRepository.findByTestSetId(testSetId)
                .stream()
                .map(tqg -> new TestSetQuestionOrderResponse(
                        tqg.getQuestionGroup().getId(),
                        tqg.getQuestionPartOrder()
                ))
                .toList();
    }

    @Override
    @Transactional
    public UUID togglePublicStatus(UUID id) {
        TestSetEntity entity = testSetRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bài test với ID: " + id));

        boolean currentStatus = Boolean.TRUE.equals(entity.isPublic());
        entity.setPublic(!currentStatus);

        log.info("Toggled public status for test set {} => {}", id, entity.isPublic());
        return entity.getId();
    }

    @Override
    public PageableResponse<TestSetResponse> getPublicTestSets(Pageable pageable, String testName, UUID collectionId) {

        String safeName = (testName == null || testName.isBlank()) ? null : testName.trim();
        Page<UUID> idsPage = testSetRepository.findPublicTestSetIds(safeName, collectionId, pageable);

        if (idsPage.isEmpty()) {
            return new PageableResponse<>(List.of(), 0L);
        }

        List<TestSetEntity> entities = testSetRepository.findByIdsWithDetails(idsPage.getContent());

        Map<UUID, TestSetEntity> entityMap = entities.stream()
                .collect(Collectors.toMap(TestSetEntity::getId, e -> e));

        List<TestSetEntity> orderedEntities = idsPage.getContent().stream()
                .map(entityMap::get)
                .filter(Objects::nonNull)
                .toList();

        // Remove collection if private or deleted
        orderedEntities.forEach(test -> {
            if (test.getCollection() != null) {
                TestCollectionEntity c = test.getCollection();
                if (!c.isPublic() || c.getStatus() == -1) test.setCollection(null);
            }
        });

        List<UUID> testsetIds = orderedEntities.stream().map(TestSetEntity::getId).toList();
        Map<UUID, Boolean> takenMap = getTakenMapForUser(testsetIds);

        List<TestSetResponse> responses = orderedEntities.stream()
                .map(entity -> {
                    TestSetResponse r = testSetMapper.toPublicTestSetResponse(entity);
                    r.setIsTaken(takenMap.getOrDefault(entity.getId(), false));
                    return r;
                })
                .toList();

        return new PageableResponse<>(responses, idsPage.getTotalElements());
    }
    private Map<UUID, Boolean> getTakenMapForUser(List<UUID> testsetIds) {
        Long currentUserId = null;
        try {
//            currentUserId = Long.valueOf(authUserContext.getUserId());
        } catch (Exception ignored) {}

        if (currentUserId == null || testsetIds.isEmpty()) {
            return Map.of();
        }

//        ApiResponse<Map<UUID, Boolean>> res =
//                testEvaluationClient.hasUserTakenTestBatch(currentUserId, testsetIds);
//
//        return (res != null && res.getData() != null)
//                ? res.getData()
//                : Map.of();
        return null;
    }

}