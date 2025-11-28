package com.defty.question_bank_service.repository;

import com.defty.question_bank_service.entity.QuestionEntity;
import com.defty.question_bank_service.entity.QuestionTagMappingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IQuestionTagMappingRepository extends JpaRepository<QuestionTagMappingEntity, UUID> {

    List<QuestionTagMappingEntity> findByQuestion(QuestionEntity question);

    List<QuestionTagMappingEntity> findByQuestionAndStatus(QuestionEntity question, Integer status);

    void deleteByQuestion(QuestionEntity question);
}