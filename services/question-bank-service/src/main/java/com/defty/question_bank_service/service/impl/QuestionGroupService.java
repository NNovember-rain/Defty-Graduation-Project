package com.defty.question_bank_service.service.impl;

import com.example.common_library.exceptions.AppException;
import com.example.common_library.exceptions.ErrorCode;
//import com.defty.common_library.file.ServerFileService;
//import com.defty.common_library.utils.FileUrlUtil;
import com.defty.question_bank_service.dto.request.*;
import com.defty.question_bank_service.dto.response.QuestionGroupResponse;
import com.defty.question_bank_service.entity.*;
import com.defty.question_bank_service.enums.QuestionSource;
import com.defty.question_bank_service.enums.Status;
import com.defty.question_bank_service.mapper.QuestionGroupMapper;
import com.defty.question_bank_service.repository.*;
import com.defty.question_bank_service.service.IQuestionGroupService;
import com.example.common_library.file.CloudinaryFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class QuestionGroupService implements IQuestionGroupService {

    private final IQuestionGroupRepository groupRepository;
    private final IQuestionRepository questionRepository;
    private final IAnswerRepository answerRepository;
    private final IFileRepository fileRepository;
    private final IQuestionTagRepository questionTagRepository;
    private final IQuestionTagMappingRepository questionTagMappingRepository;
    private final QuestionGroupMapper mapper;
    private final CloudinaryFileService cloudinaryFileService;
//    private final ServerFileService serverFileService;
//    private final FileUrlUtil fileUrlUtil;

    @Override
    @Transactional(readOnly = true)
    public Page<QuestionGroupResponse> getAll(
            Status status,
            List<UUID> testSetIds,
            List<UUID> excludeTestSetIds,
            List<UUID> tagIds,
            String questionPart,
            String difficulty,
            QuestionSource source,
            String sortBy,
            String sortOrder,
            int page,
            int limit
    ) {
        sortBy = (sortBy == null || sortBy.isBlank()) ? "createdDate" : sortBy;
        Sort.Direction direction = "asc".equalsIgnoreCase(sortOrder)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Sort sort = switch (sortBy.toLowerCase()) {
            case "createddate", "created" -> Sort.by(direction, "createddate");
            default -> Sort.by(Sort.Direction.DESC, "createddate");
        };

        Pageable pageable = PageRequest.of(page, limit, sort);

        UUID[] tagIdsArray = (tagIds != null && !tagIds.isEmpty())
                ? tagIds.toArray(new UUID[0])
                : new UUID[0];

        UUID[] testSetIdsArray = (testSetIds != null && !testSetIds.isEmpty())
                ? testSetIds.toArray(new UUID[0])
                : new UUID[0];

        UUID[] excludeTestSetIdsArray = (excludeTestSetIds != null && !excludeTestSetIds.isEmpty())
                ? excludeTestSetIds.toArray(new UUID[0])
                : new UUID[0];

        boolean filterByTags = tagIds != null && !tagIds.isEmpty();
        boolean filterByTestSets = testSetIds != null && !testSetIds.isEmpty();
        boolean excludeByTestSets = excludeTestSetIds != null && !excludeTestSetIds.isEmpty();
        Integer statusCode = (status != null) ? status.getCode() : null;
        String sourceString = (source != null) ? source.name() : null;

        Page<QuestionGroupEntity> pageResult = groupRepository.searchByMultipleFields(
                Status.DELETED.getCode(),
                statusCode,
                questionPart,
                difficulty,
                sourceString,
                testSetIdsArray,
                excludeTestSetIdsArray,
                tagIdsArray,
                filterByTestSets,
                excludeByTestSets,
                filterByTags,
                pageable
        );

        if (pageResult.getContent().isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        List<UUID> groupIds = pageResult.getContent().stream()
                .map(QuestionGroupEntity::getId)
                .toList();

        List<QuestionGroupEntity> groupsWithData = groupRepository.findAllWithDetailsByIds(groupIds);

        Map<UUID, QuestionGroupEntity> groupMap = groupsWithData.stream()
                .collect(Collectors.toMap(QuestionGroupEntity::getId, g -> g));

        List<QuestionGroupEntity> sortedGroups = groupIds.stream()
                .map(groupMap::get)
                .filter(Objects::nonNull)
                .toList();

        List<QuestionGroupResponse> responses = sortedGroups.stream()
                .peek(group -> {
                    group.getQuestions().removeIf(q -> q.getStatus().equals(Status.DELETED.getCode()));
                    group.getQuestions().forEach(q -> {
                        q.getAnswers().removeIf(a -> a.getStatus().equals(Status.DELETED.getCode()));
                        q.getQuestionTagMappings().removeIf(m ->
                                m.getStatus().equals(Status.DELETED.getCode()) ||
                                        m.getQuestionTag().getStatus().equals(Status.DELETED.getCode())
                        );
                    });
                    group.getFiles().removeIf(f -> f.getStatus().equals(Status.DELETED.getCode()));
                })
                .map(mapper::toResponse)
                .toList();

        return new PageImpl<>(responses, pageable, pageResult.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionGroupResponse getById(UUID id) {
        QuestionGroupEntity entity = groupRepository.findFullDetailById(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question group not found"));

        entity.getQuestions().removeIf(q -> q.getStatus().equals(Status.DELETED.getCode()));
        entity.getQuestions().forEach(q -> {
            q.getAnswers().removeIf(a -> a.getStatus().equals(Status.DELETED.getCode()));
            q.getQuestionTagMappings().removeIf(m -> m.getStatus().equals(Status.DELETED.getCode()));
        });
        entity.getFiles().removeIf(f -> f.getStatus().equals(Status.DELETED.getCode()));

        return mapper.toResponse(entity);
    }

    @Override
    public QuestionGroupResponse create(QuestionGroupRequest request) {
        QuestionGroupEntity entity = mapper.toEntity(request);
        entity.setStatus(Status.ACTIVE.getCode());
        return mapper.toResponse(groupRepository.save(entity));
    }

    @Override
    public QuestionGroupResponse update(UUID id, QuestionGroupRequest request) {
        QuestionGroupEntity existing = groupRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question group not found or deleted"));

        mapper.updateEntity(request, existing);
        return mapper.toResponse(groupRepository.save(existing));
    }

    @Override
    public QuestionGroupResponse toggleStatus(UUID id) {
        QuestionGroupEntity group = groupRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question group not found or deleted"));

        if (group.getStatus().equals(Status.ACTIVE.getCode())) {
            group.setStatus(Status.INACTIVE.getCode());
        } else if (group.getStatus().equals(Status.INACTIVE.getCode())) {
            group.setStatus(Status.ACTIVE.getCode());
        }

        return mapper.toResponse(groupRepository.save(group));
    }

    @Override
    public void softDelete(UUID id) {
        QuestionGroupEntity group = groupRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question group not found or already deleted"));

        group.setStatus(Status.DELETED.getCode());
        groupRepository.save(group);
    }

    @Override
    @Transactional
    public QuestionGroupResponse createBulk(QuestionGroupBulkRequest request,
                                            List<MultipartFile> uploadedFiles) throws IOException {
        validateNoIdsForCreate(request);

        // Create question group
        QuestionGroupEntity groupEntity = mapper.toEntity(request.getQuestionGroup());
        groupEntity.setStatus(Status.ACTIVE.getCode());
        groupEntity.setSource(QuestionSource.MANUAL);
        groupEntity.setSourceFileProcessing(null);
        QuestionGroupEntity savedGroup = groupRepository.save(groupEntity);

        // Create questions + answers
        createQuestions(savedGroup, request.getQuestions());

        // Create files (mapping uploadedFiles theo thứ tự id == null)
        createFilesFromRequest(savedGroup, request.getFiles(), uploadedFiles);

        return getById(savedGroup.getId());
    }

    @Override
    @Transactional
    public QuestionGroupResponse updateBulk(UUID id,
                                            QuestionGroupBulkRequest request,
                                            List<MultipartFile> uploadedFiles) throws IOException {

        QuestionGroupEntity existingGroup = groupRepository.findByIdAndNotDeleted(id, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question group not found"));

        mapper.updateEntity(request.getQuestionGroup(), existingGroup);
        QuestionGroupEntity savedGroup = groupRepository.save(existingGroup);

        // Process questions + answers
        processQuestions(savedGroup, request.getQuestions());

        // Process files (CREATE/UPDATE/DELETE)
        processFilesFromRequest(savedGroup, request.getFiles(), uploadedFiles);

        return getById(savedGroup.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionGroupResponse getQuestionGroupByQuestionId(UUID questionId) {
        // 1. Tìm question và kiểm tra tồn tại
        QuestionEntity question = questionRepository.findByIdAndNotDeleted(questionId, Status.DELETED.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND,
                        "Question not found or has been deleted"));

        // 2. Lấy questionGroup từ question
        QuestionGroupEntity questionGroup = question.getQuestionGroup();

        if (questionGroup == null) {
            throw new AppException(ErrorCode.NOT_FOUND,
                    "Question group not found for this question");
        }

        // 3. Kiểm tra questionGroup chưa bị xóa
        if (questionGroup.getStatus().equals(Status.DELETED.getCode())) {
            throw new AppException(ErrorCode.NOT_FOUND,
                    "Question group has been deleted");
        }

        // 4. Lấy đầy đủ thông tin questionGroup (including questions, answers, files, tags)
        // Sử dụng lại method getById() đã có sẵn để đảm bảo logic filtering và mapping giống nhau
        UUID groupId = questionGroup.getId();
        return getById(groupId);
    }

    // ========== VALIDATION ==========

    private void validateNoIdsForCreate(QuestionGroupBulkRequest request) {
        if (request.getQuestions() != null) {
            for (QuestionBulkRequest q : request.getQuestions()) {
                if (q.getId() != null) throw new AppException(ErrorCode.BAD_REQUEST, "Question ID must be null in create");
                if (q.getAnswers() != null) {
                    for (AnswerBulkRequest a : q.getAnswers()) {
                        if (a.getId() != null)
                            throw new AppException(ErrorCode.BAD_REQUEST, "Answer ID must be null in create");
                    }
                }
            }
        }
        if (request.getFiles() != null) {
            for (FileBulkRequest f : request.getFiles()) {
                if (f.getId() != null)
                    throw new AppException(ErrorCode.BAD_REQUEST, "File ID must be null in create");
            }
        }
    }

    private void validateAnswers(List<AnswerBulkRequest> answers, String questionText) {
        if (answers == null || answers.isEmpty())
            throw new AppException(ErrorCode.BAD_REQUEST, "Question '" + questionText + "' must have answers");

        long correctCount = answers.stream().filter(AnswerBulkRequest::getIsCorrect).count();
        if (correctCount != 1)
            throw new AppException(ErrorCode.BAD_REQUEST, "Question '" + questionText + "' must have exactly one correct answer");

        Set<Integer> orderSet = answers.stream()
                .map(AnswerBulkRequest::getAnswerOrder)
                .collect(Collectors.toSet());
        if (orderSet.size() != answers.size())
            throw new AppException(ErrorCode.BAD_REQUEST, "Duplicate answer order in question '" + questionText + "'");
    }

    private void validateQuestionNumbers(List<QuestionBulkRequest> questions) {
        Set<Integer> numbers = questions.stream()
                .map(QuestionBulkRequest::getQuestionNumber)
                .collect(Collectors.toSet());
        if (numbers.size() != questions.size())
            throw new AppException(ErrorCode.BAD_REQUEST, "Duplicate question numbers found");
    }

    // ========== CREATE OPERATIONS ==========

    private void createQuestions(QuestionGroupEntity group, List<QuestionBulkRequest> requests) {
        if (requests == null || requests.isEmpty()) return;

        validateQuestionNumbers(requests);

        for (QuestionBulkRequest req : requests) {
            validateAnswers(req.getAnswers(), req.getQuestionText());

            QuestionEntity question = new QuestionEntity();
            question.setQuestionNumber(req.getQuestionNumber());
            question.setQuestionText(req.getQuestionText());
            question.setDifficulty(req.getDifficulty());
            question.setStatus(Status.ACTIVE.getCode());
            question.setQuestionGroup(group);
            QuestionEntity savedQuestion = questionRepository.save(question);

            List<AnswerEntity> answers = req.getAnswers().stream().map(a -> {
                AnswerEntity ans = new AnswerEntity();
                ans.setContent(a.getContent());
                ans.setAnswerOrder(a.getAnswerOrder());
                ans.setIsCorrect(a.getIsCorrect());
                ans.setStatus(Status.ACTIVE.getCode());
                ans.setQuestion(savedQuestion);
                return ans;
            }).toList();

            answerRepository.saveAll(answers);

            assignTagsToQuestion(savedQuestion, req.getTagIds());
        }
    }

    private void createFilesFromRequest(QuestionGroupEntity group,
                                        List<FileBulkRequest> fileRequests,
                                        List<MultipartFile> uploadedFiles) throws IOException {
        if (fileRequests == null || fileRequests.isEmpty()) return;

        int uploadIndex = 0;

        for (FileBulkRequest fileReq : fileRequests) {
            if (fileReq.getId() != null)
                throw new AppException(ErrorCode.BAD_REQUEST, "File ID must be null for CREATE");

            if (uploadedFiles == null || uploadIndex >= uploadedFiles.size())
                throw new AppException(ErrorCode.BAD_REQUEST, "Missing uploaded file for CREATE (type: " + fileReq.getType() + ")");

            MultipartFile file = uploadedFiles.get(uploadIndex++);
            if (file.isEmpty())
                throw new AppException(ErrorCode.BAD_REQUEST, "Uploaded file cannot be empty");

            String fileUrl = cloudinaryFileService.uploadFile(file);

            FileEntity entity = new FileEntity();
            entity.setUrl(fileUrl);
            entity.setType(fileReq.getType());
            entity.setDisplayOrder(fileReq.getDisplayOrder() != null ? fileReq.getDisplayOrder() : 0);
            entity.setStatus(Status.ACTIVE.getCode());
            entity.setQuestionGroup(group);

            fileRepository.save(entity);
        }
    }

    // ========== UPDATE/DELETE OPERATIONS ==========

    private void processQuestions(QuestionGroupEntity group, List<QuestionBulkRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            softDeleteAllQuestions(group);
            return;
        }

        validateQuestionNumbers(requests);

        Set<UUID> requestIds = requests.stream()
                .map(QuestionBulkRequest::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<QuestionEntity> existingQuestions = questionRepository.findByQuestionGroupAndStatus(group, Status.ACTIVE.getCode());

        for (QuestionEntity existing : existingQuestions) {
            if (!requestIds.contains(existing.getId())) {
                existing.setStatus(Status.DELETED.getCode());
                if (existing.getAnswers() != null)
                    existing.getAnswers().forEach(a -> a.setStatus(Status.DELETED.getCode()));
                questionRepository.save(existing);
            }
        }

        for (QuestionBulkRequest req : requests) {
            validateAnswers(req.getAnswers(), req.getQuestionText());
            if (req.getId() == null)
                createQuestion(group, req);
            else
                updateQuestion(req);
        }
    }

    private void createQuestion(QuestionGroupEntity group, QuestionBulkRequest req) {
        QuestionEntity q = new QuestionEntity();
        q.setQuestionNumber(req.getQuestionNumber());
        q.setQuestionText(req.getQuestionText());
        q.setDifficulty(req.getDifficulty());
        q.setStatus(Status.ACTIVE.getCode());
        q.setQuestionGroup(group);
        QuestionEntity saved = questionRepository.save(q);

        List<AnswerEntity> answers = req.getAnswers().stream().map(a -> {
            AnswerEntity ans = new AnswerEntity();
            ans.setContent(a.getContent());
            ans.setAnswerOrder(a.getAnswerOrder());
            ans.setIsCorrect(a.getIsCorrect());
            ans.setStatus(Status.ACTIVE.getCode());
            ans.setQuestion(saved);
            return ans;
        }).toList();

        answerRepository.saveAll(answers);

        assignTagsToQuestion(saved, req.getTagIds());
    }

    private void updateQuestion(QuestionBulkRequest req) {
        QuestionEntity existing = questionRepository.findById(req.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Question not found: " + req.getId()));

        if (existing.getStatus().equals(Status.DELETED.getCode()))
            throw new AppException(ErrorCode.BAD_REQUEST, "Cannot update deleted question");

        existing.setQuestionNumber(req.getQuestionNumber());
        existing.setQuestionText(req.getQuestionText());
        existing.setDifficulty(req.getDifficulty());

        QuestionEntity saved = questionRepository.save(existing);
        processAnswers(saved, req.getAnswers());

        processTagsForQuestion(saved, req.getTagIds());
    }

    private void processAnswers(QuestionEntity question, List<AnswerBulkRequest> answerRequests) {
        Set<UUID> requestIds = answerRequests.stream()
                .map(AnswerBulkRequest::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<AnswerEntity> existingAnswers = answerRepository.findByQuestionAndStatus(question, Status.ACTIVE.getCode());

        for (AnswerEntity existing : existingAnswers) {
            if (!requestIds.contains(existing.getId())) {
                existing.setStatus(Status.DELETED.getCode());
                answerRepository.save(existing);
            }
        }

        for (AnswerBulkRequest req : answerRequests) {
            if (req.getId() == null) {
                AnswerEntity a = new AnswerEntity();
                a.setContent(req.getContent());
                a.setAnswerOrder(req.getAnswerOrder());
                a.setIsCorrect(req.getIsCorrect());
                a.setStatus(Status.ACTIVE.getCode());
                a.setQuestion(question);
                answerRepository.save(a);
            } else {
                AnswerEntity existing = answerRepository.findById(req.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Answer not found: " + req.getId()));
                if (existing.getStatus().equals(Status.DELETED.getCode()))
                    throw new AppException(ErrorCode.BAD_REQUEST, "Cannot update deleted answer");

                existing.setContent(req.getContent());
                existing.setAnswerOrder(req.getAnswerOrder());
                existing.setIsCorrect(req.getIsCorrect());
                answerRepository.save(existing);
            }
        }
    }

    private void processFilesFromRequest(QuestionGroupEntity group,
                                         List<FileBulkRequest> fileRequests,
                                         List<MultipartFile> uploadedFiles) throws IOException {
        if (fileRequests == null) {
            softDeleteAllFiles(group);
            return;
        }

        Set<UUID> requestIds = fileRequests.stream()
                .map(FileBulkRequest::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<FileEntity> existingFiles = fileRepository.findByQuestionGroupAndStatus(group, Status.ACTIVE.getCode());
        for (FileEntity existing : existingFiles) {
            if (!requestIds.contains(existing.getId())) {
                existing.setStatus(Status.DELETED.getCode());
                fileRepository.save(existing);
            }
        }

        int uploadIndex = 0;

        for (FileBulkRequest fileReq : fileRequests) {
            if (fileReq.getId() == null) {
                if (uploadedFiles == null || uploadIndex >= uploadedFiles.size())
                    throw new AppException(ErrorCode.BAD_REQUEST, "Missing file for CREATE");

                MultipartFile file = uploadedFiles.get(uploadIndex++);
                String url = cloudinaryFileService.uploadFile(file);

                FileEntity newFile = new FileEntity();
                newFile.setUrl(url);
                newFile.setType(fileReq.getType());
                newFile.setDisplayOrder(fileReq.getDisplayOrder() != null ? fileReq.getDisplayOrder() : 0);
                newFile.setStatus(Status.ACTIVE.getCode());
                newFile.setQuestionGroup(group);
                fileRepository.save(newFile);
            } else {
                FileEntity existing = fileRepository.findById(fileReq.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "File not found: " + fileReq.getId()));

                if (!existing.getQuestionGroup().getId().equals(group.getId()))
                    throw new AppException(ErrorCode.BAD_REQUEST, "File does not belong to this question group");

                if (existing.getStatus().equals(Status.DELETED.getCode()))
                    throw new AppException(ErrorCode.BAD_REQUEST, "Cannot update deleted file");

                existing.setType(fileReq.getType());
                existing.setDisplayOrder(fileReq.getDisplayOrder() != null ? fileReq.getDisplayOrder() : 0);
                fileRepository.save(existing);
            }
        }
    }

    /**
     * Gán tags cho câu hỏi mới (CREATE)
     */
    private void assignTagsToQuestion(QuestionEntity question, List<UUID> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) return;

        List<QuestionTagEntity> tags = questionTagRepository.findAllById(tagIds);
        if (tags.size() != tagIds.size()) {
            throw new AppException(ErrorCode.NOT_FOUND,
                    "Some tags not found. Expected: " + tagIds.size() + ", Found: " + tags.size());
        }

        List<QuestionTagMappingEntity> mappings = tags.stream()
                .map(tag -> QuestionTagMappingEntity.builder()
                        .question(question)
                        .questionTag(tag)
                        .build())
                .toList();

        questionTagMappingRepository.saveAll(mappings);
    }

    /**
     * Xử lý tags cho câu hỏi (UPDATE) - gỡ tags cũ và gán tags mới
     */
    private void processTagsForQuestion(QuestionEntity question, List<UUID> tagIds) {
        List<QuestionTagMappingEntity> existingMappings =
                questionTagMappingRepository.findByQuestion(question);

        Set<UUID> existingTagIds = existingMappings.stream()
                .map(m -> m.getQuestionTag().getId())
                .collect(Collectors.toSet());

        Set<UUID> newTagIds = tagIds != null ? new HashSet<>(tagIds) : new HashSet<>();

        // 1. Xóa các mapping không còn trong danh sách mới
        List<QuestionTagMappingEntity> mappingsToDelete = existingMappings.stream()
                .filter(m -> !newTagIds.contains(m.getQuestionTag().getId()))
                .toList();

        if (!mappingsToDelete.isEmpty()) {
            questionTagMappingRepository.deleteAll(mappingsToDelete);
        }

        // 2. Thêm các tag mới (chưa có mapping)
        Set<UUID> tagsToAdd = newTagIds.stream()
                .filter(tagId -> !existingTagIds.contains(tagId))
                .collect(Collectors.toSet());

        if (!tagsToAdd.isEmpty()) {
            List<QuestionTagEntity> tags = questionTagRepository.findAllById(tagsToAdd);
            if (tags.size() != tagsToAdd.size()) {
                throw new AppException(ErrorCode.NOT_FOUND,
                        "Some tags not found. Expected: " + tagsToAdd.size() + ", Found: " + tags.size());
            }

            List<QuestionTagMappingEntity> newMappings = tags.stream()
                    .map(tag -> QuestionTagMappingEntity.builder()
                            .question(question)
                            .questionTag(tag)
                            .build())
                    .toList();

            questionTagMappingRepository.saveAll(newMappings);
        }
    }

    private void softDeleteAllQuestions(QuestionGroupEntity group) {
        List<QuestionEntity> qs = questionRepository.findByQuestionGroupAndStatus(group, Status.ACTIVE.getCode());
        qs.forEach(q -> {
            q.setStatus(Status.DELETED.getCode());
            if (q.getAnswers() != null) q.getAnswers().forEach(a -> a.setStatus(Status.DELETED.getCode()));
        });
        questionRepository.saveAll(qs);
    }

    private void softDeleteAllFiles(QuestionGroupEntity group) {
        List<FileEntity> files = fileRepository.findByQuestionGroupAndStatus(group, Status.ACTIVE.getCode());
        files.forEach(f -> f.setStatus(Status.DELETED.getCode()));
        fileRepository.saveAll(files);
    }
}