package com.defty.identity.repository;

import com.defty.identity.entity.ApiKey;
import com.defty.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long>{
    ApiKey findByUserIdAndIsActive(Long userId, Integer isActive);

    @Modifying
    @Query("UPDATE ApiKey k SET k.isActive = 0 WHERE k.user = :user")
    void deactivateAllByUser(@Param("user") User user);

}

