package com.defty.content_service.utils;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UploadFile {
    @Value("${cloudinary.url}")
    private String cloudinaryUrl;


    public String upload(MultipartFile file) throws IOException {
        Cloudinary cloudinary = new Cloudinary(cloudinaryUrl);
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Tên file không hợp lệ.");
        }

        String uniqueFilename = UUID.randomUUID() + "_" + originalFilename;
        String contentType = file.getContentType();
        boolean isImage = contentType != null && contentType.startsWith("image/");

        Map<String, Object> options = ObjectUtils.asMap(
                "public_id", uniqueFilename,
                "use_filename", true,
                "unique_filename", false,
                "overwrite", false,
                "resource_type", "raw"
        );

        if (isImage) {
            options.put("transformation", new Transformation()
                    .quality("auto")
                    .fetchFormat("auto"));
        }

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        return uploadResult.get("secure_url").toString();
    }

}
