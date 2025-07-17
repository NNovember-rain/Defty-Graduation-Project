package com.defty.content_service.service.impl;

import com.defty.content_service.dto.request.MaterialUploadRequest;
import com.defty.content_service.dto.response.MaterialUploadResponse;
import com.defty.content_service.entity.Material;
import com.defty.content_service.repository.MaterialRepository;
import com.defty.content_service.service.MaterialService;
import com.defty.content_service.specification.MaterialSpecification;
import com.defty.content_service.utils.UploadFile;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.DecimalFormat;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MaterialServiceImpl implements MaterialService {
    MaterialRepository materialRepository;
    UploadFile uploadFile;
    ModelMapper modelMapper;

    @Override
    public MaterialUploadResponse uploadMaterial(MaterialUploadRequest request) throws IOException {
        String url = uploadFile.upload(request.getFile());

        Material material = Material.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .url(url)
                .size(request.getFile().getSize())
                .format(getFileExtension(request.getFile().getOriginalFilename()))
                .classId(request.getClassId())
                .userId(request.getUserId())
                .status(1)
                .build();

       materialRepository.save(material);
        return MaterialUploadResponse.builder()
                .title(material.getTitle())
                .description(material.getDescription())
                .type(material.getType())
                .format(material.getFormat())
                .url(material.getUrl())
                .readableSize(readableFileSize(material.getSize()))
                .classId(material.getClassId())
                .userId(material.getUserId())
                .build();
    }

    @Override
    public Page<MaterialUploadResponse> getAllMaterials(String type, String format, String title, Pageable pageable) {
        log.info("Filtering with type={}, format={}, title={}", type, format, title);
        Specification<Material> spec = MaterialSpecification.filter(type, format, title);
        return materialRepository.findAll(spec, pageable)
                .map(this::toMaterialUploadResponse);
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) return null;
        int index = fileName.lastIndexOf('.');
        return (index == -1) ? null : fileName.substring(index + 1).toLowerCase();
    }

    public static String readableFileSize(long size) {
        if (size <= 0) return "0 B";
        final String[] units = new String[]{"B", "KB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
        return new DecimalFormat("#,##0.#").format(size / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }

    private MaterialUploadResponse toMaterialUploadResponse(Material material) {
        return MaterialUploadResponse.builder()
                .title(material.getTitle())
                .description(material.getDescription())
                .type(material.getType())
                .format(material.getFormat())
                .url(material.getUrl())
                .readableSize(readableFileSize(material.getSize()))
                .classId(material.getClassId())
                .userId(material.getUserId())
                .build();
    }
}
