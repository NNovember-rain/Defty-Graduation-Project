package com.example.common_library.utils;

import org.springframework.stereotype.Component;

@Component
public class StringUtil {
    public static String removeAccents(String input) {
        if (input == null) return null;
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "").toLowerCase();
    }
}