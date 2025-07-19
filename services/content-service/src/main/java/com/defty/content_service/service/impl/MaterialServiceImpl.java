package com.defty.content_service.service.impl;

import com.defty.content_service.client.IdentityServiceClient;
import com.defty.content_service.dto.request.MaterialRequest;
import com.defty.content_service.dto.request.MaterialUploadRequest;
import com.defty.content_service.dto.response.MaterialResponse;
import com.defty.content_service.dto.response.MaterialUploadResponse;
import com.defty.content_service.entity.Material;
import com.defty.content_service.entity.MaterialClass;
import com.defty.content_service.repository.MaterialClassRepository;
import com.defty.content_service.repository.MaterialRepository;
import com.defty.content_service.service.MaterialService;
import com.defty.content_service.specification.MaterialSpecification;
import com.defty.content_service.utils.UploadFile;
import com.example.common_library.exceptions.NotFoundException;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.text.DecimalFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MaterialServiceImpl implements MaterialService {
    MaterialRepository materialRepository;
    UploadFile uploadFile;
    MaterialClassRepository materialClassRepository;
    IdentityServiceClient identityServiceClient;

    @Override
    public MaterialUploadResponse uploadMaterial(MaterialUploadRequest request) throws IOException {
        try {
            identityServiceClient.getUser(request.getUserId());
        } catch (FeignException.NotFound ex) {
            throw new IllegalArgumentException("User not found with id: " + request.getUserId());
        } catch (Exception ex) {
            throw new NotFoundException("User Service is not available.");
        }

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
        return toMaterialUploadResponse(material);
    }

    @Override
    public Page<MaterialUploadResponse> getAllMaterials(String type, String format, String title, Pageable pageable) {
        log.info("Filtering with type={}, format={}, title={}", type, format, title);
        Specification<Material> spec = MaterialSpecification.filter(type, format, title);
        return materialRepository.findAll(spec, pageable)
                .map(this::toMaterialUploadResponse);
    }

    @Override
    public MaterialResponse assignMaterialToClasses(MaterialRequest request) {
        Long materialId = request.getMaterialId();

        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found with id: " + materialId));

        for (Long classId : request.getClassIds()) {
            boolean exists = materialClassRepository.findAll().stream()
                    .anyMatch(mc -> mc.getMaterial().getId().equals(materialId) && mc.getClassId().equals(classId));

            if (!exists) {
                MaterialClass mc = MaterialClass.builder()
                        .material(material)
                        .classId(classId)
                        .build();
                materialClassRepository.save(mc);
            }
        }

        List<Long> assignedClassIds = materialClassRepository.findAll().stream()
                .filter(mc -> mc.getMaterial().getId().equals(materialId))
                .map(MaterialClass::getClassId)
                .distinct()
                .toList();

        return MaterialResponse.builder()
                .materialId(materialId)
                .classIds(assignedClassIds)
                .build();
    }

    @Override
    public MaterialResponse unassignMaterialFromClasses(MaterialRequest request) {
        Long materialId = request.getMaterialId();

        List<MaterialClass> materialClasses = materialClassRepository.findByMaterialId(materialId);

        for (Long classId : request.getClassIds()) {
            materialClasses.stream()
                    .filter(mc -> mc.getClassId().equals(classId))
                    .findFirst()
                    .ifPresent(materialClassRepository::delete);
        }

        List<Long> remainingClassIds = materialClassRepository.findByMaterialId(materialId)
                .stream()
                .map(MaterialClass::getClassId)
                .toList();

        return MaterialResponse.builder()
                .materialId(materialId)
                .classIds(remainingClassIds)
                .build();
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
