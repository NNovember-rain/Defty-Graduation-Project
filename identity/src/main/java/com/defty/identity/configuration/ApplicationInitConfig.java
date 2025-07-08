package com.defty.identity.configuration;

import com.defty.identity.entity.Role;
import com.defty.identity.entity.User;
import com.defty.identity.repository.RoleRepository;
import com.defty.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;

    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository){
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()){
                Set<Role> roles = new HashSet<>();
                if (!roleRepository.existsRoleByName("ADMIN")) {
                    Role role = new Role();
                    role.setName("ADMIN");
                    role.setDescription("Administrator role with all permissions");
                    roleRepository.save(role);
                    roles.add(role);
                } else {
                    Role role = roleRepository.findByName("ADMIN")
                            .orElseThrow(() -> new RuntimeException("Role ADMIN not found"));
                    roles.add(role);
                }
                User user = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin"))
                        .roles(roles)
                        .build();

                userRepository.save(user);
                log.warn("admin user has been created with default password: admin, please change it");
            }
        };
    }
}
