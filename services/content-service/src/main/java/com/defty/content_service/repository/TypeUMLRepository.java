package com.defty.content_service.repository;

import com.defty.content_service.entity.TypeUML;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TypeUMLRepository extends JpaRepository<TypeUML, Long>, JpaSpecificationExecutor<TypeUML> {
    boolean existsByName(String name);
}
