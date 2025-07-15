package com.example.demo.service;

import com.example.common_library.exceptions.DuplicateEntryException;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    public boolean emailExists(String email) {
        return "test@example.com".equalsIgnoreCase(email);
    }

    public void registerUser(String email, String password) {
        System.out.println("Kiểm tra email: " + email);

        if (emailExists(email)) {
            throw new DuplicateEntryException("email", email);
        }

        System.out.println("Đăng ký người dùng với email " + email + " thành công!");
    }
}