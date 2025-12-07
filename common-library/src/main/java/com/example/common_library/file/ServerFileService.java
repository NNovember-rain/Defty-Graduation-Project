//package com.example.common_library.file;
//
//import com.defty.common_library.exceptions.AppException;
//import com.defty.common_library.exceptions.ErrorCode;
//import com.defty.common_library.utils.SlugUtil;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.stereotype.Service;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.IOException;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.nio.file.Paths;
//import java.nio.file.StandardCopyOption;
//import java.util.Set;
//import java.util.UUID;
//
//@Slf4j
//@Service
//public class ServerFileService {
//
//    private final ServerFileProperties props;
//
//    public ServerFileService(ServerFileProperties props) {
//        this.props = props;
//        log.info("Server file storage active at root: {}", props.getRootDir());
//    }
//
//    private Path getCategoryDir(String category) throws IOException {
//        Path dir = Paths.get(props.getRootDir(), category);
//        Files.createDirectories(dir);
//        return dir;
//    }
//
//    public String saveFile(MultipartFile file) throws IOException {
//        if (file == null || file.isEmpty())
//            throw new AppException(ErrorCode.INVALID_FILE, "File is empty.");
//
//        String originalName = file.getOriginalFilename();
//        String ext = (originalName != null && originalName.contains("."))
//                ? originalName.substring(originalName.lastIndexOf(".") + 1).toLowerCase()
//                : "";
//
//        // Phân loại loại file theo đuôi
//        String category = detectCategory(file, ext);
//
//        // 🔹 Nếu đuôi rỗng, thử lấy lại từ content-type
//        if ((ext == null || ext.isBlank()) && file.getContentType() != null) {
//            String contentType = file.getContentType();
//            if (contentType.contains("/")) {
//                ext = contentType.substring(contentType.lastIndexOf('/') + 1).toLowerCase();
//                log.info("Fallback extension from contentType: {}", ext);
//            }
//        }
//
//        // Giới hạn dung lượng theo loại file
//        long limit = getLimitByCategory(category);
//        if (file.getSize() > limit) {
//            throw new AppException(ErrorCode.FILE_TOO_LARGE,
//                    "File size exceeds the limit of " + limit + " bytes for category: " + category);
//        }
//        log.info(file.getSize()+"-------"+limit);
//        String baseName = removeExtension(originalName);
//        String slug = SlugUtil.createSlug(baseName);
//        String newName = String.format("%s-%s.%s", slug, UUID.randomUUID().toString().replace("-", ""), ext);
//
//        Path target = getCategoryDir(category).resolve(newName);
//
//        log.info("Saving [{}] file '{}' as category '{}' → {}", ext, originalName, category, target.toAbsolutePath());
//
//        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
//
//        if (!Files.exists(target))
//            throw new AppException(ErrorCode.INVALID_FILE, "File not found after saving: " + target.toAbsolutePath());
//
//        long fileSize = Files.size(target);
//        log.info("File saved successfully: {} ({} bytes)", target.toAbsolutePath(), fileSize);
//
//        return String.format("chamtoeic-defty/media/%s/%s", category, newName);
//    }
//
//    private String removeExtension(String filename) {
//        if (filename == null) return "file";
//        int dotIndex = filename.lastIndexOf('.');
//        return (dotIndex > 0) ? filename.substring(0, dotIndex) : filename;
//    }
//
//    private long getLimitByCategory(String category) {
//        ServerFileProperties.Limits limits = props.getLimits();
//        return switch (category) {
//            case "images" -> limits.getImageMaxSize();
//            case "audio" -> limits.getAudioMaxSize();
//            case "videos" -> limits.getVideoMaxSize();
//            case "documents" -> limits.getDocumentMaxSize();
//            default -> limits.getDefaultMaxSize();
//        };
//    }
//
//    private String detectCategory(MultipartFile file, String ext) {
//        Set<String> imageExts = Set.of("jpg", "jpeg", "png", "gif", "bmp", "webp", "svg");
//        Set<String> audioExts = Set.of("mp3", "wav", "ogg", "m4a", "aac");
//        Set<String> videoExts = Set.of("mp4", "avi", "mov", "mkv", "flv", "webm");
//        Set<String> documentExts = Set.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv");
//
//        if (imageExts.contains(ext)) return "images";
//        if (audioExts.contains(ext)) return "audio";
//        if (videoExts.contains(ext)) return "videos";
//        if (documentExts.contains(ext)) return "documents";
//
//        // Trường hop không xác định được bằng đuôi, thử kiểm tra content-type
//        String contentType = file.getContentType();
//        if (contentType != null) {
//            if (contentType.startsWith("image/")) return "images";
//            if (contentType.startsWith("audio/")) return "audio";
//            if (contentType.startsWith("video/")) return "videos";
//            if (contentType.startsWith("application/pdf")) return "documents";
//            if (contentType.startsWith("application/msword") ||
//                    contentType.startsWith("application/vnd.openxmlformats-officedocument")) return "documents";
//        }
//
//        return "others";
//    }
//
//    public String deleteFile(String relativePath) {
//        try {
//            if (relativePath == null || relativePath.isBlank()) {
//                throw new AppException(ErrorCode.INVALID_FILE, "Path is empty or null.");
//            }
//
//            // ✅ Chỉ xử lý file trong hệ thống server
//            if (!relativePath.startsWith("chamtoeic-defty/")) {
//                throw new AppException(ErrorCode.INVALID_FILE,
//                        "File không thuộc quyền quản lý của server này: " + relativePath);
//            }
//
//            // ✅ Bỏ tiền tố "chamtoeic-defty/media/"
//            String cleanedPath = relativePath.replaceFirst("^chamtoeic-defty/media/", "");
//
//            // ✅ Ghép với root-dir (/app/shared)
//            Path absolute = Paths.get(props.getRootDir(), cleanedPath);
//
//            log.info("Try delete: {}", absolute.toAbsolutePath());
//
//            boolean deleted = Files.deleteIfExists(absolute);
//            if (!deleted) {
//                throw new AppException(ErrorCode.INVALID_FILE,
//                        "File not found to delete: " + absolute.toAbsolutePath());
//            }
//            log.info("File deleted successfully: {}", absolute.toAbsolutePath());
//            return "File deleted successfully.";
//        } catch (AppException e) {
//            throw e;
//        } catch (Exception e) {
//            log.error("Failed to delete file {}: {}", relativePath, e.getMessage());
//            throw new AppException(ErrorCode.INVALID_FILE, "Error deleting file: " + e.getMessage());
//        }
//    }
//
//}
