package com.example.common_library.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CloudinaryUploadResponse {
    private final String url;
    private final String publicId;

    public CloudinaryUploadResponse(String url, String publicId) {
        this.url = url;
        this.publicId = publicId;
    }
}

