package com.defty.content_service.repository;

import com.defty.content_service.entity.MaterialClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialClassRepository extends JpaRepository<MaterialClass,Integer> {
    List<MaterialClass> findByMaterialId(Long id);
}
