package com.defty.content_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Material extends BaseEntity{
    String title;
    String description;
    String type; // e.g., "image", "document"
    String url; // URL to access the material
    Long size;
    String format; // e.g., "mp4", "mp3", "pdf"
    Long classId;
    Integer status;
    Long userId;

    @OneToMany(mappedBy = "material", fetch = FetchType.LAZY)
    Set<MaterialClass> materialClass;
}
