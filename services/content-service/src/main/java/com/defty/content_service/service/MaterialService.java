package com.defty.content_service.service;

import com.defty.content_service.dto.request.MaterialRequest;
import com.defty.content_service.dto.request.MaterialUploadRequest;
import com.defty.content_service.dto.response.MaterialResponse;
import com.defty.content_service.dto.response.MaterialUploadResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.io.IOException;

public interface MaterialService {
    MaterialUploadResponse uploadMaterial(MaterialUploadRequest request) throws IOException;
    Page<MaterialUploadResponse> getAllMaterials(String type, String format, String title, Pageable pageable);
    MaterialResponse assignMaterialToClasses(MaterialRequest request);
    MaterialResponse unassignMaterialFromClasses(MaterialRequest request);
}
