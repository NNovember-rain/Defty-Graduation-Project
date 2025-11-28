package com.defty.question_bank_service.utils;

import com.defty.question_bank_service.repository.ITestCollectionRepository;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
@Component
public class SlugUtils {

    public static String toSlug(String input) {
        if (input == null) return null;

        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");

        String slug = normalized.toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");

        return slug;
    }

    public static String generateUniqueSlug(String base, ITestCollectionRepository repo, UUID excludeId) {
        String slug = toSlug(base);
        String uniqueSlug = slug;
        int counter = 1;

        while (true) {
            boolean exists;
            if (excludeId != null) {
                exists = repo.existsBySlugAndIdNot(uniqueSlug, excludeId);
            } else {
                exists = repo.existsBySlug(uniqueSlug);
            }

            if (!exists) {
                return uniqueSlug;
            }

            uniqueSlug = slug + "-" + counter;
            counter++;
        }
    }
}
