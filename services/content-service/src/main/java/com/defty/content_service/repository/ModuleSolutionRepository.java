package com.defty.content_service.repository;

import com.defty.content_service.entity.ModuleEntity;
import com.defty.content_service.entity.ModuleSolution;
import com.defty.content_service.enums.TypeUml;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuleSolutionRepository extends JpaRepository<ModuleSolution, Long> {
    List<ModuleSolution> findByModuleId(Long moduleId);
    List<ModuleSolution> findByModuleIdIn(List<Long> moduleIds);
    ModuleSolution findByModuleAndTypeUml(ModuleEntity module, TypeUml typeUml);
}
