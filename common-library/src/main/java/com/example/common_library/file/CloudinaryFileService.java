package com.example.common_library.file;

import com.cloudinary.Cloudinary;
import com.example.common_library.dto.response.CloudinaryUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
public class CloudinaryFileService {

    private final Cloudinary cloudinary;

    public CloudinaryFileService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
        log.info("Cloudinary file service ready.");
    }

    public CloudinaryFileService cloudinaryFileService(Cloudinary cloudinary) {
        return new CloudinaryFileService(cloudinary);
    }

    public String uploadFile(MultipartFile file) throws IOException {
        // Giới hạn kích thước file 20MB cho audio/video
        final long MAX_SIZE = 20 * 1024 * 1024;
        if (file == null || file.isEmpty()) {
            throw new IOException("File is empty or null.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new IOException("File size exceeds 20MB limit.");
        }
        try {
            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of("resource_type", "auto") // QUAN TRỌNG: cho phép mọi loại file
            );
            return (String) uploadResult.get("url");
        } catch (IOException e) {
            log.error("Failed to upload file to Cloudinary: {}", e.getMessage());
            throw new IOException("Failed to upload file to Cloudinary.", e);
        }
    }

    /**
     * Upload file lên Cloudinary, trả về cả url và publicId
     * @param file MultipartFile
     * @return CloudinaryUploadResult chứa url và publicId
     * @throws IOException nếu upload thất bại hoặc file quá lớn
     */
    public CloudinaryUploadResponse uploadFileWithPublicId(MultipartFile file) throws IOException {
        final long MAX_SIZE = 20 * 1024 * 1024; // tăng lên 20MB cho audio/video
        if (file == null || file.isEmpty()) {
            throw new IOException("File is empty or null.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new IOException("File size exceeds 20MB limit.");
        }

        try {
            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    Map.of("resource_type", "auto") // hỗ trợ mp3, mp4, pdf, image...
            );
            String url = (String) uploadResult.get("url");
            String publicId = (String) uploadResult.get("public_id");
            return new CloudinaryUploadResponse(url, publicId);
        } catch (IOException e) {
            throw new IOException("Failed to upload file to Cloudinary.", e);
        }
    }

    /**
     * Xóa ảnh trên Cloudinary bằng publicId
     * @param publicId publicId của ảnh trên Cloudinary
     * @return true nếu xóa thành công, false nếu không tìm thấy hoặc lỗi
     */
    public boolean deleteImage(String publicId) {
        try {
            Map result = cloudinary.uploader().destroy(publicId, Map.of());
            Object status = result.get("result");
            return "ok".equals(status);
        } catch (Exception e) {
            log.error("Failed to delete image from Cloudinary: {}", e.getMessage());
            return false;
        }
    }
}