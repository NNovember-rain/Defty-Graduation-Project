package com.defty.identity.repository;

import com.defty.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUserCode(String userCode);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsernameAndIdNot(String username, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByUserCodeAndIdNot(String userCode, Long id);
    List<User> findAllByIdInAndIsActive(List<Long> userIds, Integer isActive);
}

