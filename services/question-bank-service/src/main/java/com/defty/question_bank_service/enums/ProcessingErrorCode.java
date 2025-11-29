package com.defty.question_bank_service.enums;

import lombok.Getter;

@Getter
public enum ProcessingErrorCode {

    // Lỗi OCR (Giai đoạn 3)
    OCR_FAILED("OCR_001", "OCR thất bại - File quá mờ hoặc không đọc được"),
    OCR_TIMEOUT("OCR_002", "OCR vượt quá thời gian xử lý"),
    OCR_INVALID_FORMAT("OCR_003", "Định dạng file không hợp lệ cho OCR"),

    // Lỗi Parsing/Phân tích cấu trúc (Giai đoạn 3)
    PARSE_STRUCTURE_FAILED("PARSE_001", "Không nhận diện được cấu trúc đề TOEIC"),
    PARSE_MISSING_PARTS("PARSE_002", "Thiếu thông tin Parts trong đề thi"),
    PARSE_INVALID_QUESTIONS("PARSE_003", "Câu hỏi không đủ 4 đáp án (A-D)"),
    PARSE_NO_CORRECT_ANSWER("PARSE_004", "Không xác định được đáp án đúng"),
    PARSE_JSON_INVALID("PARSE_005", "Dữ liệu JSON đầu ra không hợp lệ"),
    PARSE_TIMEOUT("PARSE_006", "Phân tích cấu trúc vượt quá thời gian"),

    // Lỗi Database (Giai đoạn 4)
    DB_CONNECTION_FAILED("DB_001", "Không thể kết nối đến cơ sở dữ liệu"),
    DB_SCHEMA_MISMATCH("DB_002", "Dữ liệu không khớp với schema database"),
    DB_DUPLICATE_ERROR("DB_003", "Dữ liệu trùng lặp khi chèn"),
    DB_TRANSACTION_FAILED("DB_004", "Transaction không hoàn thành trọn vẹn"),
    DB_CONSTRAINT_VIOLATION("DB_005", "Vi phạm ràng buộc dữ liệu"),

    // Lỗi File/Storage (Giai đoạn 2)
    FILE_NOT_FOUND("FILE_001", "Không tìm thấy file"),
    FILE_CORRUPTED("FILE_002", "File bị hỏng hoặc không đọc được"),
    FILE_TOO_LARGE("FILE_003", "File vượt quá kích thước cho phép"),
    STORAGE_FULL("FILE_004", "Dung lượng lưu trữ đã đầy"),
    STORAGE_PERMISSION_DENIED("FILE_005", "Không có quyền truy cập storage"),

    // Lỗi Validation (Giai đoạn 1-2)
    VALIDATION_TESTSET_NOT_FOUND("VAL_001", "Test Set không tồn tại"),
    VALIDATION_INVALID_PART_TYPE("VAL_002", "Loại phần thi không hợp lệ"),
    VALIDATION_UNAUTHORIZED("VAL_003", "Không có quyền truy cập"),

    // Lỗi AI Service
    AI_SERVICE_UNAVAILABLE("AI_001", "AI Service không khả dụng"),
    AI_SERVICE_TIMEOUT("AI_002", "AI Service không phản hồi"),
    AI_SERVICE_ERROR("AI_003", "Lỗi từ AI Service"),

    // Lỗi khác
    UNKNOWN_ERROR("UNKNOWN", "Lỗi không xác định"),
    CANCELLED_BY_USER("CANCELLED", "Bị hủy bởi người dùng");

    private final String code;
    private final String message;

    ProcessingErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public static ProcessingErrorCode fromCode(String code) {
        for (ProcessingErrorCode errorCode : values()) {
            if (errorCode.code.equals(code)) {
                return errorCode;
            }
        }
        return UNKNOWN_ERROR;
    }
}