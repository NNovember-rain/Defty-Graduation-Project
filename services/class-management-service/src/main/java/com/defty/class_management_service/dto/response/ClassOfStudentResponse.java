package com.defty.class_management_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassOfStudentResponse {
    private Long classId;          // id lớp học
    private String className;      // Tên lớp học (Lập trình Java)
    private String classCode;      // Mã lớp (CNTT2023)
    private String teacherName;    // Tên giảng viên (TS. Nguyễn Văn A)
    private Integer newAssignments;// Số bài tập mới (2)
}
