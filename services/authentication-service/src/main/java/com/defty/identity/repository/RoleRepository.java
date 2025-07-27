package com.defty.identity.repository;

import com.defty.identity.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long>, JpaSpecificationExecutor<Role> {
    Optional<Role> findByName(String name);
    boolean existsRoleByName(String name);
    Optional<Role> findByIdAndIsActive(Long id, Integer isActive);
    boolean existsByNameAndIdNot(String name, Long id);
}
