package com.defty.identity.repository;

import com.defty.identity.entity.Permission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long>, JpaSpecificationExecutor<Permission> {
    boolean existsByNameAndIdNot(String name, Long id);
    Optional<Permission> findByIdAndIsActive(Long id, Integer isActive);
    @Query(value = "SELECT p.* FROM permission p " +
            "JOIN role_permissions rp ON p.id = rp.permissions_id " +
            "WHERE rp.role_id = :roleId " +
            "AND p.is_active = 1 " +
            "AND (:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')))",

            countQuery = "SELECT COUNT(*) FROM permission p " +
                    "JOIN role_permissions rp ON p.id = rp.permissions_id " +
                    "WHERE rp.role_id = :roleId " +
                    "AND p.is_active = 1 " +
                    "AND (:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')))",
            nativeQuery = true)
    Page<Permission> findAllActiveByRoleIdAndNameContaining(@Param("roleId") Long roleId,
                                                            @Param("name") String name,
                                                            Pageable pageable);

}
