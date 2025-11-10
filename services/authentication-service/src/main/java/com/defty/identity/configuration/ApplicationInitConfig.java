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
            if (userRepository.findByUsername("hiep").isEmpty()){
                Set<Role> roles = new HashSet<>();
                if (!roleRepository.existsRoleByName("student")) {
                    Role role = new Role();
                    role.setName("student");
                    role.setDescription("Full system access. Can manage users, roles, settings, and perform administrative tasks.");
                    roleRepository.save(role);
                    roles.add(role);
                } else {
                    Role role = roleRepository.findByName("student")
                            .orElseThrow(() -> new RuntimeException("Role admin not found"));
                    roles.add(role);
                }
                User user = User.builder()
                        .username("hiep")
                        .email("hiep@gmail.com")
                        .fullName("hiep22")
                        .isActive(1)
                        .password(passwordEncoder.encode("Defty@12345"))
                        .roles(roles)
                        .build();

                userRepository.save(user);
                log.warn("admin user has been created with default password: admin, please change it");
            }
        };
    }
}
